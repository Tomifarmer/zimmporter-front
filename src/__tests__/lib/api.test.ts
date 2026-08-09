import type { InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RuntimeConfig } from "@/lib/config";

describe("api auth interceptor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function getMod() {
    return vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  }

  function makeConfig(): InternalAxiosRequestConfig {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    return config;
  }

  async function runInterceptor(token?: string) {
    const mod = await getMod();
    mod.setAccessToken(token);

    const config = makeConfig();
    const handler = mod.api.interceptors.request.handlers?.[0];
    if (!handler?.fulfilled) return config;
    return (await handler.fulfilled(config)) ?? config;
  }

  it("adds Authorization header when access token is set", async () => {
    const result = await runInterceptor("my-test-token");
    expect(result.headers.Authorization).toBe("Bearer my-test-token");
  });

  it("does not add Authorization header when access token is not set", async () => {
    const result = await runInterceptor(undefined);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it("updates the token when setAccessToken is called again", async () => {
    const mod = await getMod();
    mod.setAccessToken("first-token");
    mod.setAccessToken("second-token");

    const config = makeConfig();
    const handler = mod.api.interceptors.request.handlers?.[0];
    const result = (await handler?.fulfilled(config)) ?? config;

    expect(result.headers.Authorization).toBe("Bearer second-token");
  });
});

type RuntimeConfigWindow = { __RUNTIME_CONFIG__?: RuntimeConfig };

describe("api response interceptor", () => {
  async function getMod() {
    return vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  }

  function setRuntimeConfig(overrides: Partial<RuntimeConfig>) {
    (window as RuntimeConfigWindow).__RUNTIME_CONFIG__ = {
      apiUrl: "http://localhost:8000",
      apiKey: "",
      useSimpleAuth: false,
      useSocialLogin: false,
      ...overrides,
    };
  }

  function unauthorizedResponse(detail: string) {
    return { response: { status: 401, data: { detail } } };
  }

  type ResponseInterceptorRejected = (error: unknown) => Promise<unknown>;

  async function runRejected(handler: ResponseHandler | undefined, error: unknown) {
    if (!handler?.rejected) throw new Error("no response interceptor registered");
    try {
      await handler.rejected(error);
    } catch (err) {
      return err as Error;
    }
    return undefined;
  }

  type ResponseHandler = {
    rejected?: ResponseInterceptorRejected;
  };

  async function responseHandler(mod: typeof import("@/lib/api")) {
    return mod.api.interceptors.response.handlers?.[0];
  }

  beforeEach(async () => {
    const mod = await getMod();
    mod.setAccessToken(undefined);
    mod.clearAuthTokenInvalid();
    mod.clearSocialLoginError();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as RuntimeConfigWindow).__RUNTIME_CONFIG__;
  });

  it("rejects with a friendly message and notifies when social login token is invalid", async () => {
    const mod = await getMod();
    setRuntimeConfig({ useSocialLogin: true });
    mod.setAccessToken("expired-token");
    mod.clearAuthTokenInvalid();
    const cb = vi.fn();
    mod.onAuthTokenInvalid(cb);

    const err = await runRejected(
      await responseHandler(mod),
      unauthorizedResponse("Invalid or missing authentication token"),
    );

    expect(err?.message).toBe("Session expired. Please sign in again.");
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("does not notify again for subsequent invalid-token responses", async () => {
    const mod = await getMod();
    setRuntimeConfig({ useSocialLogin: true });
    mod.setAccessToken(undefined);
    const cb = vi.fn();
    mod.onAuthTokenInvalid(cb);

    const error = unauthorizedResponse("Invalid or missing authentication token");
    const handler = await responseHandler(mod);
    await runRejected(handler, error);
    await runRejected(handler, error);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("uses the social login error path when social login is disabled", async () => {
    const mod = await getMod();
    setRuntimeConfig({ useSocialLogin: false });
    mod.setAccessToken(undefined);
    mod.clearAuthTokenInvalid();
    const cb = vi.fn();
    mod.onSocialLoginError(cb);

    await runRejected(
      await responseHandler(mod),
      unauthorizedResponse("Invalid or missing authentication token"),
    );

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("surfaces the raw error message when no auth-related cause is detected", async () => {
    const mod = await getMod();
    setRuntimeConfig({ useSocialLogin: false });
    mod.setAccessToken(undefined);

    const err = await runRejected(
      await responseHandler(mod),
      unauthorizedResponse("Some other error"),
    );

    expect(err?.message).toBe("Some other error");
  });
});

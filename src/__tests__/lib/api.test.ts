import type { InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

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

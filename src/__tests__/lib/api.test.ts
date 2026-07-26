import type { InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("api auth interceptor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function getMod() {
    return vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  }

  function makeConfig(): InternalAxiosRequestConfig {
    return { headers: { common: {} } } as InternalAxiosRequestConfig;
  }

  async function runInterceptor(token?: string) {
    const mod = await getMod();
    mod.setAccessToken(token);

    const config = makeConfig();
    return mod.api.interceptors.request.handlers?.[0]?.fulfilled(
      config,
    ) as Promise<InternalAxiosRequestConfig>;
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
    const result = (await mod.api.interceptors.request.handlers?.[0]?.fulfilled(
      config,
    )) as Promise<InternalAxiosRequestConfig>;

    expect(result.headers.Authorization).toBe("Bearer second-token");
  });
});

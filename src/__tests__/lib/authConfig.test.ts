import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authConfig } from "@/lib/auth";

vi.mock("next-auth", () => ({
  __esModule: true,
  default: () => ({ handlers: {}, auth: {}, signIn: {}, signOut: {} }),
}));

const originalEnv = { ...process.env };

describe("authConfig", () => {
  beforeEach(() => {
    vi.stubEnv("USE_SOCIAL_LOGIN", "true");
    vi.stubEnv("OIDC_ISSUER_URL", "https://idp.example.com");
    vi.stubEnv("OIDC_CLIENT_ID", "client-id");
    vi.stubEnv("OIDC_CLIENT_SECRET", "client-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = { ...originalEnv };
  });

  it("passes OIDC groups from login into the JWT", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: NextAuth callback params are internal
    const config = authConfig() as any;

    const jwt = await config.callbacks.jwt({
      token: {},
      user: { id: "1", name: "Test", email: "t@example.com", groups: ["IBR", "SEB"] },
      account: { id_token: "id-token" },
    });

    expect(jwt.groups).toEqual(["IBR", "SEB"]);
  });

  it("does not set groups on the JWT when the user has none", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: NextAuth callback params are internal
    const config = authConfig() as any;

    const jwt = await config.callbacks.jwt({
      token: {},
      user: { id: "1", name: "Test", email: "t@example.com" },
      account: { id_token: "id-token" },
    });

    expect(jwt.groups).toBeUndefined();
  });

  it("adds groups to the session user", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: NextAuth callback params are internal
    const config = authConfig() as any;

    const result = await config.callbacks.session({
      session: { user: { name: "Test", email: "t@example.com" } },
      token: { accessToken: "id-token", groups: ["IBR"] },
    });

    expect(result.user.groups).toEqual(["IBR"]);
  });
});

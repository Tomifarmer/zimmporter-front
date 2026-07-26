import NextAuth from "next-auth";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-in-production";

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const enabled = process.env.AUTH_ENABLED === "true";

  if (!enabled) {
    return { secret: AUTH_SECRET, providers: [] };
  }

  return {
    secret: AUTH_SECRET,
    providers: [
      {
        id: "oidc",
        name: process.env.AUTH_OIDC_NAME || "OIDC",
        type: "oidc" as const,
        issuer: process.env.AUTH_OIDC_ISSUER ?? "",
        clientId: process.env.AUTH_OIDC_CLIENT_ID ?? "",
        clientSecret: process.env.AUTH_OIDC_CLIENT_SECRET ?? "",
        checks: ["pkce", "state"],
        authorization: {
          params: { scope: "openid email profile" },
        },
      },
    ],
    callbacks: {
      async jwt({ token, account }) {
        if (account?.access_token) {
          token.accessToken = account.access_token;
        }
        return token;
      },
      async session({ session, token }) {
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        }
        return session;
      },
    },
  };
});

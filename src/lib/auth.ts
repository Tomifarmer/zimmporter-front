import NextAuth from "next-auth";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-in-production";

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const enabled = process.env.USE_OIDC === "true";

  if (!enabled) {
    return { secret: AUTH_SECRET, providers: [] };
  }

  return {
    secret: AUTH_SECRET,
    providers: [
      {
        id: "oidc",
        name: process.env.OIDC_NAME || "OIDC",
        type: "oidc" as const,
        issuer: process.env.OIDC_ISSUER_URL ?? "",
        clientId: process.env.OIDC_CLIENT_ID ?? "",
        clientSecret: process.env.OIDC_CLIENT_SECRET ?? "",
        checks: ["pkce", "state"],
        authorization: {
          params: { scope: "openid email profile" },
        },
        profile(profile) {
          return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            image: profile.picture,
          };
        },
      },
    ],
    callbacks: {
      async jwt({ token, account, user }) {
        if (account?.id_token) {
          token.accessToken = account.id_token;
        }
        if (user?.image) {
          token.picture = user.image;
        }
        return token;
      },
      async session({ session, token }) {
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        }
        if (token.picture) {
          session.user = { ...session.user, image: token.picture as string };
        }
        return session;
      },
    },
  };
});

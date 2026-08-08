import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    groups?: string[];
  }

  interface Session {
    accessToken?: string;
    user: {
      groups?: string[];
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    groups?: string[];
  }
}

import type { NextFetchEvent, NextRequest } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/lib/auth";

const authEnabled = process.env.AUTH_ENABLED === "true";

const handler = auth((req: NextAuthRequest) => {
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return Response.redirect(loginUrl);
  }
});

export function middleware(req: NextRequest, event: NextFetchEvent) {
  if (authEnabled) {
    return handler(req, event as never);
  }
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"],
};

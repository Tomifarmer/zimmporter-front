import type { NextAuthRequest } from "next-auth";
import { auth } from "@/lib/auth";

export default auth((req: NextAuthRequest) => {
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"],
};

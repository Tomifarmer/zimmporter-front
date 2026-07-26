import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"],
};

export async function proxy(req: NextRequest) {
  if (process.env.USE_OIDC !== "true") return;

  const session = await auth();
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return Response.redirect(loginUrl);
  }
}

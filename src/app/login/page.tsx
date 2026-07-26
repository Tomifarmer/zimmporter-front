import { redirect } from "next/navigation";
import LoginClient from "./client";

export default async function LoginPage() {
  const { auth } = await import("@/lib/auth");
  const session = await auth();

  if (session?.user) {
    redirect("/search");
  }

  return <LoginClient />;
}

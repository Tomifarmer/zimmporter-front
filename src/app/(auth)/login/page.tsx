import { redirect } from "next/navigation";
import LoginClient from "./client";

export default async function LoginPage() {
  const { auth } = await import("@/lib/auth");
  const session = await auth();

  if (session?.user) {
    redirect("/search");
  }

  const issuer = process.env.OIDC_ISSUER_URL || "";
  const providerInfo =
    process.env.OIDC_NAME
      ? { name: process.env.OIDC_NAME, icon: "pi-user" }
      : issuer.includes("google")
        ? { name: "Google", icon: "pi-google" }
        : issuer.includes("github")
          ? { name: "GitHub", icon: "pi-github" }
          : { name: "OIDC", icon: "pi-user" };

  return <LoginClient providerName={providerInfo.name} providerIcon={providerInfo.icon} />;
}

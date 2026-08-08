import { redirect } from "next/navigation";
import LoginClient from "./client";

export type ProviderInfo = {
  id: string;
  name: string;
  icon: string;
};

export default async function LoginPage() {
  const { auth } = await import("@/lib/auth");
  const session = await auth();

  if (session?.user) {
    redirect("/search");
  }

  const providers: ProviderInfo[] = [];

  if (process.env.OIDC_ISSUER_URL && process.env.OIDC_CLIENT_ID) {
    const name = process.env.OIDC_NAME || "";
    const issuer = process.env.OIDC_ISSUER_URL || "";
    const displayName = name || (issuer.includes("google") ? "Google" : "OIDC");
    let icon = "pi-user";
    if (issuer.includes("google")) {
      icon = "pi-google";
    } else if (issuer.includes("authentik")) {
      icon = "/authentik.svg";
    }
    providers.push({ id: "oidc", name: displayName, icon });
  }

  if (process.env.GITHUB_CLIENT_ID) {
    providers.push({ id: "github", name: "GitHub", icon: "pi-github" });
  }

  return <LoginClient providers={providers} />;
}

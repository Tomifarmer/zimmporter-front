import * as fs from "node:fs";
import { join } from "node:path";
import ApiKeyErrorOverlay from "@/components/ApiKeyErrorOverlay";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import LightfallBackground from "@/components/LightfallBackground";
import PageContainer from "@/components/PageContainer";
import SocialLoginErrorOverlay from "@/components/SocialLoginErrorOverlay";
import AuthProvider from "@/providers/auth-provider";

const appVersion = JSON.parse(fs.readFileSync(join(process.cwd(), "package.json"), "utf8")).version;

function StickyFooter({ version }: { version: string }) {
  return (
    <div className="sticky-footer-wrapper">
      <Footer version={version} />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const useSocialLogin = process.env.USE_SOCIAL_LOGIN === "true";

  return (
    <AuthProvider useSocialLogin={useSocialLogin}>
      <Header useSocialLogin={useSocialLogin} />
      <div className="lightfall-bg-wrapper">
        <LightfallBackground />
      </div>
      <PageContainer>{children}</PageContainer>
      <StickyFooter version={appVersion} />
      <ApiKeyErrorOverlay />
      <SocialLoginErrorOverlay />
    </AuthProvider>
  );
}

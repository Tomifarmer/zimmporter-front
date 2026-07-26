import * as fs from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Script from "next/script";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import LightfallBackground from "@/components/LightfallBackground";
import PageContainer from "@/components/PageContainer";
import AuthProvider from "@/providers/auth-provider";
import Providers from "@/providers/query-provider";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zimmporter",
  description: "Music Importer Dashboard",
};

const appVersion = JSON.parse(fs.readFileSync(join(process.cwd(), "package.json"), "utf8")).version;

function StickyFooter({ version }: { version: string }) {
  return (
    <div className="sticky-footer-wrapper">
      <Footer version={version} />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtimeConfig = {
    apiUrl: process.env.API_URL || "http://localhost:8000",
    apiKey: process.env.API_KEY || "",
    authEnabled: process.env.AUTH_ENABLED === "true",
  };

  return (
    <html lang="en" className="dark">
      <body>
        <Script id="runtime-config" strategy="beforeInteractive">
          {`window.__RUNTIME_CONFIG__ = ${JSON.stringify(runtimeConfig)};`}
        </Script>
        <AuthProvider>
          <Header />
          <div className="lightfall-bg-wrapper">
            <LightfallBackground />
          </div>
          <Providers>
            <PageContainer>{children}</PageContainer>
          </Providers>
        </AuthProvider>
        <StickyFooter version={appVersion} />
      </body>
    </html>
  );
}

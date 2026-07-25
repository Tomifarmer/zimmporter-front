import type { Metadata } from "next";
import Script from "next/script";
import * as fs from 'fs';
import { join } from 'path';
import Providers from "@/providers/query-provider";
import Header from "@/components/Header";
import PageContainer from "@/components/PageContainer";
import LightfallBackground from "@/components/LightfallBackground";
import Footer from "@/components/Footer";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zimmporter",
  description: "Music Importer Dashboard",
};

const appVersion = JSON.parse(fs.readFileSync(join(process.cwd(), 'package.json'), 'utf8')).version;

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
  };

  return (
    <html lang="en" className="dark">
      <body>
        <Script id="runtime-config" strategy="beforeInteractive">
          {`window.__RUNTIME_CONFIG__ = ${JSON.stringify(runtimeConfig)};`}
        </Script>
        <Header />
        <div className="lightfall-bg-wrapper"><LightfallBackground /></div>
        <Providers>
          <PageContainer>{children}</PageContainer>
        </Providers>
        <StickyFooter version={appVersion} />
      </body>
    </html>
  );
}

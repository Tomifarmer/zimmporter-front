import type { Metadata } from "next";
import * as fs from 'fs';
import { join } from 'path';
import Providers from "@/providers/query-provider";
import Header from "@/components/Header";
import PageContainer from "@/components/PageContainer";
import LightfallBackground from "@/components/LightfallBackground";
import Footer from "@/components/Footer";
import "./globals.css";

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
  return (
    <html lang="en" className="dark">
      <body>
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

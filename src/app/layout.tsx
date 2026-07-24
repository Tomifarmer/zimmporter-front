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
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10 }}>
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
      <body style={{ backgroundColor: '#0f172a', position: 'relative' }}>
        <Header />
        <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}><LightfallBackground /></div>
        <Providers>
          <PageContainer>{children}</PageContainer>
        </Providers>
        <StickyFooter version={appVersion} />
      </body>
    </html>
  );
}

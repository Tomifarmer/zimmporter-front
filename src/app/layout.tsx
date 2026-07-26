import type { Metadata } from "next";
import Script from "next/script";
import AuthConflictOverlay from "@/components/AuthConflictOverlay";
import Providers from "@/providers/query-provider";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zimmporter",
  description: "Music Importer Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const useSocialLogin = process.env.USE_SOCIAL_LOGIN === "true";
  const useSimpleAuth = process.env.USE_SIMPLE_AUTH === "true";
  const authConflict = useSocialLogin && useSimpleAuth;

  const runtimeConfig = {
    apiUrl: process.env.API_URL || "http://localhost:8000",
    apiKey: process.env.API_KEY || "",
    useSocialLogin,
    useSimpleAuth,
  };

  return (
    <html lang="en" className="dark">
      <body>
        <Script id="runtime-config" strategy="beforeInteractive">
          {`window.__RUNTIME_CONFIG__ = ${JSON.stringify(runtimeConfig)};`}
        </Script>
        <Providers>{children}</Providers>
        <AuthConflictOverlay conflict={authConflict} />
      </body>
    </html>
  );
}

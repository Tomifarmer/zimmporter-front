"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { setAccessToken } from "@/lib/api";
import { getRuntimeConfig } from "@/lib/config";

function AccessTokenSync() {
  const { data: session } = useSession();

  useEffect(() => {
    setAccessToken(session?.accessToken);
  }, [session]);

  return null;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { authEnabled } = getRuntimeConfig();

  if (!authEnabled) {
    return <>{children}</>;
  }

  return (
    <SessionProvider>
      <AccessTokenSync />
      {children}
    </SessionProvider>
  );
}

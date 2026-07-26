"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { setAccessToken } from "@/lib/api";

function AccessTokenSync() {
  const { data: session } = useSession();

  useEffect(() => {
    setAccessToken(session?.accessToken);
  }, [session]);

  return null;
}

export default function AuthProvider({
  useSocialLogin,
  children,
}: {
  useSocialLogin?: boolean;
  children: React.ReactNode;
}) {
  if (!useSocialLogin) {
    return <>{children}</>;
  }

  return (
    <SessionProvider>
      <AccessTokenSync />
      {children}
    </SessionProvider>
  );
}

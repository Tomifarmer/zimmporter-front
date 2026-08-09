"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { clearAuthTokenInvalid, onAuthTokenInvalid, setAccessToken } from "@/lib/api";

function AccessTokenSync() {
  const { data: session } = useSession();

  useEffect(() => {
    setAccessToken(session?.accessToken);
  }, [session]);

  return null;
}

function AuthTokenInvalidRedirect() {
  useEffect(() => {
    onAuthTokenInvalid(() => {
      clearAuthTokenInvalid();
      setAccessToken(undefined);
      signOut({ redirectTo: "/login" });
    });
  }, []);

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
      <AuthTokenInvalidRedirect />
      {children}
    </SessionProvider>
  );
}

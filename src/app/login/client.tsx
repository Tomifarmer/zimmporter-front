"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginClient() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/search";

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "40vh" }}>
      <div className="text-center">
        <h2 className="mb-4">Sign in</h2>
        <p className="text-muted mb-4">Authenticate to access Zimmporter</p>
        <button
          type="button"
          className="btn btn-primary btn-lg px-5"
          onClick={() => signIn("oidc", { redirectTo: callbackUrl })}
        >
          Sign in with OIDC
        </button>
      </div>
    </div>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginClient({
  providerName,
  providerIcon,
}: {
  providerName: string;
  providerIcon: string;
}) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/search";

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
      <div
        className="text-center p-5 rounded-4"
        style={{ backgroundColor: "#1e293b", minWidth: "360px" }}
      >
        <h1 className="display-4 fw-bold mb-1" style={{ color: "#0097fb" }}>
          Zimmporter
        </h1>
        <p className="mb-4" style={{ color: "#94a3b8" }}>
          Sign in to continue
        </p>
        <button
          type="button"
          className="btn btn-outline-light btn-lg px-4 d-inline-flex align-items-center gap-2"
          onClick={() => signIn("oidc", { redirectTo: callbackUrl })}
        >
          <i className={`pi ${providerIcon}`} />
          Sign in with {providerName}
        </button>
      </div>
    </div>
  );
}

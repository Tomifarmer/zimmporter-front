"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import type { ProviderInfo } from "./page";

export default function LoginClient({ providers }: { providers: ProviderInfo[] }) {
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
        {providers.map((p) => (
          <div key={p.id} className="mb-3">
            <button
              type="button"
              className="btn btn-outline-light btn-lg px-4 d-inline-flex align-items-center gap-2 w-100"
              onClick={() => signIn(p.id, { redirectTo: callbackUrl })}
            >
              {p.icon.startsWith("/") ? (
                <img src={p.icon} alt="" width="20" height="20" className="d-inline-block" />
              ) : (
                <i className={`pi ${p.icon}`} />
              )}
              Sign in with {p.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

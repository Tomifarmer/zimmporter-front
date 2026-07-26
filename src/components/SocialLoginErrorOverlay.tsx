"use client";

import { useEffect, useState } from "react";
import { api, onSocialLoginError } from "@/lib/api";
import { getRuntimeConfig } from "@/lib/config";

export default function SocialLoginErrorOverlay() {
  const [visible, setVisible] = useState(false);
  const { useSocialLogin } = getRuntimeConfig();

  useEffect(() => {
    if (useSocialLogin) return;

    onSocialLoginError(() => setVisible(true));

    api.get("/jobs?limit=1").catch((err) => {
      if (err.message?.includes("sign in")) {
        setVisible(true);
      }
    });
  }, [useSocialLogin]);

  if (!visible) return null;

  return (
    <div
      className="d-flex align-items-center justify-content-center position-fixed"
      style={{ inset: 0, backgroundColor: "rgba(15,23,42,0.95)", zIndex: 9999 }}
    >
      <div className="text-center" style={{ maxWidth: 500 }}>
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
          style={{ width: 72, height: 72, backgroundColor: "#ef444422" }}
        >
          <i className="pi pi-exclamation-triangle text-danger" style={{ fontSize: "2rem" }} />
        </div>
        <h2 className="text-light mb-3">Authentication Required</h2>
        <p className="mb-4" style={{ color: "#cbd5e1" }}>
          The backend requires authentication, but no session is active.
        </p>
        <div
          className="text-start p-3 rounded-2 mb-4 font-monospace small"
          style={{ backgroundColor: "#1e293b", color: "#94a3b8" }}
        >
          Enable <span className="text-warning">USE_SOCIAL_LOGIN=true</span> and configure a
          provider to sign in.
        </div>
      </div>
    </div>
  );
}

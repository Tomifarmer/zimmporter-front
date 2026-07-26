"use client";

import { useEffect, useState } from "react";
import { api, onApiKeyError } from "@/lib/api";
import { getRuntimeConfig } from "@/lib/config";

export default function ApiKeyErrorOverlay() {
  const [visible, setVisible] = useState(false);
  const { useSimpleAuth } = getRuntimeConfig();

  useEffect(() => {
    onApiKeyError(() => setVisible(true));

    api.get("/jobs?limit=1").catch((err) => {
      if (err.message?.includes("API key")) {
        setVisible(true);
      }
    });
  }, []);

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
        <h2 className="text-light mb-3">API Key Required</h2>
        <p className="text-muted mb-4">
          {useSimpleAuth
            ? "The backend requires an API key for authentication, but none is configured."
            : "The backend requires an API key, but USE_SIMPLE_AUTH is not enabled."}
        </p>
        <div
          className="text-start p-3 rounded-2 mb-4 font-monospace small"
          style={{ backgroundColor: "#1e293b", color: "#94a3b8" }}
        >
          {useSimpleAuth ? (
            <>Set <span className="text-warning">API_KEY</span> in your environment variables.</>
          ) : (
            <>Set <span className="text-warning">USE_SIMPLE_AUTH=true</span> and configure <span className="text-warning">API_KEY</span>.</>
          )}
        </div>
      </div>
    </div>
  );
}

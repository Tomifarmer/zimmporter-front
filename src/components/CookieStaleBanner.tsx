"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import type { CookieStatus } from "@/types/api";

import "./CookieStaleBanner.css";

export default function CookieStaleBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data } = useQuery<CookieStatus>({
    queryKey: ["cookies-stale"],
    queryFn: async () => {
      const { data } = await api.get<CookieStatus>("/cookies");
      return data;
    },
    refetchInterval: 60_000,
  });

  if (dismissed || !data?.exists || !data.is_stale) {
    return null;
  }

  return (
    <div className="cookie-stale-banner" role="alert">
      <i className="pi pi-exclamation-triangle cookie-stale-icon" />
      <span className="cookie-stale-text">
        Your YouTube cookies are stale or invalid, so downloads run without them. Re-export fresh
        cookies and upload them in{" "}
        <Link href="/settings" className="cookie-stale-link">
          Settings
        </Link>{" "}
        to restore full access.
      </span>
      <button
        type="button"
        className="cookie-stale-dismiss"
        aria-label="Dismiss cookie warning"
        onClick={() => setDismissed(true)}
      >
        <i className="pi pi-times" />
      </button>
    </div>
  );
}

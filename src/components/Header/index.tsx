"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getRuntimeConfig } from "@/lib/config";

const navItems = [
  { label: "Search", href: "/search" },
  { label: "Jobs", href: "/jobs" },
];

function isCurrent(href: string, pathname: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

function HealthDot({ name, value }: { name: string; value: string }) {
  return (
    <div className="d-flex align-items-center gap-1 px-2">
      <span
        className="health-dot"
        style={{ "--dot-color": value === "ok" ? "#22c55e" : "#ef4444" } as React.CSSProperties}
        title={`${name.replace(/_/g, " ")}: ${value}`}
      />
    </div>
  );
}

function AuthSection() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="d-flex align-items-center gap-2">
        <span className="text-muted small">...</span>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="d-flex align-items-center gap-2">
        {session.user.image && (
          <Image
            src={session.user.image}
            alt=""
            width={28}
            height={28}
            className="rounded-circle"
            style={{ objectFit: "cover" }}
          />
        )}
        <span className="small text-light">{session.user.name ?? session.user.email}</span>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => signOut()}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => signIn("oidc")}>
      Login
    </button>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { authEnabled } = getRuntimeConfig();
  const [healthData, setHealthData] = useState<Record<string, string>>({
    api: "ok",
    redis: "ok",
    celery_worker: "ok",
    mariadb: "ok",
  });

  useEffect(() => {
    const setAllDown = () => {
      setHealthData({ api: "error", redis: "error", celery_worker: "error", mariadb: "error" });
    };

    const checkHealth = async () => {
      try {
        const { apiUrl } = getRuntimeConfig();
        const res = await fetch(`${apiUrl}/health`);
        if (res.ok) {
          const data = await res.json();
          setHealthData(data.components || {});
        } else {
          setAllDown();
        }
      } catch {
        setAllDown();
      }
    };

    const interval = setInterval(checkHealth, 1500);
    checkHealth();

    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="app-header d-flex align-items-center px-4 py-3">
      <span className="navbar-brand">Zimmporter</span>
      <div className="flex-shrink-0 d-flex gap-3 mx-auto">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`nav-link-item${isCurrent(item.href, pathname) ? " nav-link-item--active" : ""}`}
          >
            {item.label}
          </a>
        ))}
      </div>
      <div className="d-flex align-items-center gap-2">
        {authEnabled && <AuthSection />}
        {Object.keys(healthData).length > 0
          ? Object.entries(healthData).map(([name, value]) => (
              <HealthDot key={name} name={name} value={value as string} />
            ))
          : null}
      </div>
    </nav>
  );
}

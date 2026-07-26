"use client";

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
  const [open, setOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  if (status === "loading") {
    return (
      <div className="d-flex align-items-center gap-2">
        <span className="text-muted small">...</span>
      </div>
    );
  }

  if (session?.user) {
    const avatar = session.user.image;
    const initials = (session.user.name ?? session.user.email ?? "?").charAt(0).toUpperCase();
    const showImg = !!avatar && !imgFailed;

    return (
      <div className="position-relative">
        <button
          type="button"
          className="avatar-btn overflow-hidden"
          onClick={() => setOpen(!open)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setOpen(false);
            }
          }}
        >
          {showImg ? (
            <img
              src={avatar}
              alt=""
              width={28}
              height={28}
              onError={() => setImgFailed(true)}
              style={{ objectFit: "cover", cursor: "pointer", borderRadius: "50%", backgroundColor: "#ffffff" }}
            />
          ) : (
            <div
              className="d-flex align-items-center justify-content-center text-white fw-bold"
              style={{ width: 28, height: 28, fontSize: 14, backgroundColor: "#ffffff", color: "#0f172a", cursor: "pointer" }}
            >
              {initials}
            </div>
          )}
        </button>
        {open && (
          <div
            className="position-absolute end-0 mt-2 rounded-2 shadow-lg"
            style={{ backgroundColor: "#1e293b", minWidth: 180, zIndex: 100 }}
          >
            <div className="px-3 py-2 text-light small border-bottom" style={{ borderColor: "#334155" }}>
              {session.user.name ?? session.user.email}
            </div>
            <button
              type="button"
              className="btn btn-sm w-100 text-start rounded-0 px-3 py-2 text-light"
              style={{ backgroundColor: "transparent" }}
              onMouseDown={(e) => {
                e.preventDefault();
                signOut();
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#334155")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => signIn("oidc")}>
      Login
    </button>
  );
}

export default function Header({ useOidc }: { useOidc?: boolean }) {
  const pathname = usePathname();
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
        {useOidc && <AuthSection />}
        {Object.keys(healthData).length > 0
          ? Object.entries(healthData).map(([name, value]) => (
              <HealthDot key={name} name={name} value={value as string} />
            ))
          : null}
      </div>
    </nav>
  );
}

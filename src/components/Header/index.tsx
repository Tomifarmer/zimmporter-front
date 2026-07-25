"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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
        style={{ '--dot-color': value === "ok" ? "#22c55e" : "#ef4444" } as React.CSSProperties}
        title={`${name.replace(/_/g, " ")}: ${value}`}
      />
    </div>
  );
}

export default function Header() {
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
        const cfgRes = await fetch("/api/config");
        const cfg = await cfgRes.json();
        const res = await fetch(`${cfg.apiUrl}/health`);
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
            className={`nav-link-item${isCurrent(item.href, pathname) ? ' nav-link-item--active' : ''}`}
          >
            {item.label}
          </a>
        ))}
      </div>
      <div className="d-flex align-items-center gap-2">
        {Object.keys(healthData).length > 0 ? (
          Object.entries(healthData).map(([name, value], idx) => (
            <HealthDot key={idx} name={name} value={value as string} />
          ))
        ) : null}
      </div>
    </nav>
  );
}

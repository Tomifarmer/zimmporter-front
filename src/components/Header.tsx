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
  const green = value === "ok";
  return (
    <div className="d-flex align-items-center gap-1 px-2">
      <span
        style={{ display: 'inline-block', width: '0.75rem', height: '0.75rem', borderRadius: '999px', backgroundColor: green ? "#22c55e" : "#ef4444", transition: 'background-color 150ms ease' }}
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
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);

  useEffect(() => {
    const setAllDown = () => {
      setHealthData({ api: "error", redis: "error", celery_worker: "error", mariadb: "error" });
    };

    const checkHealth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/health`);
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
    <nav className="d-flex align-items-center px-4 py-3" style={{ backgroundColor: '#000000' }}>
      <span className="navbar-brand">Zimmporter</span>
      <div className="flex-shrink-0 d-flex gap-3 mx-auto">
        {navItems.map((item, i) => (
          <a
            key={item.href}
            href={item.href}

            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(-1)}
            style={{ color: '#ffffff', background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', textDecoration: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: isCurrent(item.href, pathname) || hoveredIndex === i ? '#ffffff' : 'transparent', paddingBottom: '0.375rem', transition: 'border-color 150ms ease', WebkitTapHighlightColor: 'transparent' }}
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

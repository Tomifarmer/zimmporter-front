"use client";

interface HealthCardProps {
  label: string;
  status: string;
}

export default function HealthCard({ label, status }: HealthCardProps) {
  return (
    <div className={`health-card ${status === "ok" ? "ok" : "error"}`}>
      <span className="health-card-label">{label.replace(/_/g, " ")}</span>
      <span className={`health-card-status ${status === "ok" ? "text-green-400" : "text-red-400"}`}>{status}</span>
    </div>
  );
}

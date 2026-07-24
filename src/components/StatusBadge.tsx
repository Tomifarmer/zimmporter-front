"use client";

const statusStyles: Record<string, React.CSSProperties> = {
  pending: { backgroundColor: '#6b7280', color: '#ffffff' },
  running: { backgroundColor: '#40e0d0', color: '#ffffff', animation: 'pulse-fill 1.5s ease-in-out infinite' },
  downloading: { backgroundColor: '#40e0d0', color: '#ffffff' },
  success: { backgroundColor: '#22c55e', color: '#ffffff' },
  partial: { backgroundColor: '#f59e0b', color: '#ffffff' },
  unavailable: { backgroundColor: '#a855f7', color: '#ffffff' },
  failed: { backgroundColor: '#ef4444', color: '#ffffff' },
  ok: { backgroundColor: '#22c55e', color: '#ffffff' },
  no_workers_online: { backgroundColor: '#ef4444', color: '#ffffff' },
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.pending;

  return (
    <span className="status-badge" style={style}>
      {status}
    </span>
  );
}

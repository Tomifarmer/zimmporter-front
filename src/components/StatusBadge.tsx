"use client";

const statusStyles: Record<string, React.CSSProperties> = {
  pending: { backgroundColor: '#6b7280' },
  running: { backgroundColor: '#40e0d0', animation: 'pulse-fill 1.5s ease-in-out infinite' },
  downloading: { backgroundColor: '#40e0d0' },
  success: { backgroundColor: '#22c55e' },
  failed: { backgroundColor: '#ef4444' },
  ok: { backgroundColor: '#22c55e' },
  no_workers_online: { backgroundColor: '#ef4444' },
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

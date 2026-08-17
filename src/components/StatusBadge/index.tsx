const STATUS_HINTS: Record<string, string> = {
  unavailable: "This track has no video on YouTube Music and cannot be downloaded.",
};

export default function StatusBadge({ status }: { status: string }) {
  const hint = STATUS_HINTS[status];
  return (
    <span
      className={`status-badge status-badge--${status}`}
      title={hint}
      data-testid="status-badge-hint"
    >
      {status}
    </span>
  );
}

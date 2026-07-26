export default function AuthConflictOverlay({ conflict }: { conflict: boolean }) {
  if (!conflict) return null;

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
        <h2 className="text-light mb-3">Authentication Configuration Error</h2>
        <p className="mb-4" style={{ color: "#cbd5e1" }}>
          <span className="text-warning">USE_SOCIAL_LOGIN</span> and{" "}
          <span className="text-warning">USE_SIMPLE_AUTH</span> cannot both be enabled at the same
          time.
        </p>
        <div
          className="text-start p-3 rounded-2 mb-4 font-monospace small"
          style={{ backgroundColor: "#1e293b", color: "#94a3b8" }}
        >
          Set only one to <span className="text-warning">true</span> or set both to{" "}
          <span className="text-warning">false</span>.
        </div>
      </div>
    </div>
  );
}

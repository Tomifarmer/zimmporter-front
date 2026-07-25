"use client";

export default function Footer({ version }: { version: string }) {
  return (
    <footer className="app-footer">
      <div className="d-flex align-items-center justify-content-center gap-2 text-white">
        <span>© 2026 Zimmporter</span>
        <span className="footer-separator">|</span>
        <span>v{version}</span>
      </div>
    </footer>
  );
}

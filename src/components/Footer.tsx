"use client";

export default function Footer({ version }: { version: string }) {
  return (
    <footer style={{ backgroundColor: '#000000', padding: '1rem 2rem' }}>
      <div className="d-flex align-items-center justify-content-center gap-2 text-white">
        <span>© 2026 Zimmporter</span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span>v{version}</span>
      </div>
    </footer>
  );
}

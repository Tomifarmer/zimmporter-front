import type React from "react";

export default function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="page-container">{children}</div>;
}

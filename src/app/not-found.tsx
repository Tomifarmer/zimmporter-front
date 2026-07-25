import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Not Found",
};

export default function NotFound() {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100">
      <h1 className="not-found-heading">404 — Not Found</h1>
    </div>
  );
}

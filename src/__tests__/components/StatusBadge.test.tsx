import { render, screen } from "@testing-library/react";
import StatusBadge from "@/components/StatusBadge";

describe("StatusBadge", () => {
  it("renders the status text", () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByText("running")).toBeInTheDocument();
  });

  it("applies the correct CSS class based on status", () => {
    const { container } = render(<StatusBadge status="failed" />);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain("status-badge--failed");
  });

  it("renders with different statuses", () => {
    const statuses = ["pending", "running", "success", "failed", "partial", "unavailable"];
    for (const s of statuses) {
      const { unmount } = render(<StatusBadge status={s} />);
      expect(screen.getByText(s)).toBeInTheDocument();
      unmount();
    }
  });

  it("shows a hover hint for unavailable status", () => {
    const { container } = render(<StatusBadge status="unavailable" />);
    const span = container.firstChild as HTMLElement;
    expect(span.title).toContain("no video on YouTube Music");
  });

  it("does not set a hover hint for other statuses", () => {
    const { container } = render(<StatusBadge status="failed" />);
    const span = container.firstChild as HTMLElement;
    expect(span.title).toBe("");
  });
});

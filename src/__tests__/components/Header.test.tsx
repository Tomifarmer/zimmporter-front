import { render, screen, waitFor } from "@testing-library/react";
import Header from "@/components/Header";

const mockedUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockedUsePathname(),
}));

function createFetchMock(components?: Record<string, string>, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: () =>
      Promise.resolve({
        components: components ?? { api: "ok", redis: "ok", celery_worker: "ok", mariadb: "ok" },
      }),
  });
}

describe("Header", () => {
  beforeEach(() => {
    mockedUsePathname.mockReturnValue("/search");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the brand name", () => {
    global.fetch = createFetchMock();
    render(<Header />);
    expect(screen.getByText("Zimmporter")).toBeInTheDocument();
  });

  it("renders nav links", () => {
    global.fetch = createFetchMock();
    render(<Header />);
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Jobs")).toBeInTheDocument();
  });

  it("marks the current page nav link as active", () => {
    global.fetch = createFetchMock();
    render(<Header />);
    const searchLink = screen.getByText("Search").closest("a");
    expect(searchLink?.className).toContain("nav-link-item--active");
  });

  it("does not mark inactive nav links as active", () => {
    global.fetch = createFetchMock();
    render(<Header />);
    const jobsLink = screen.getByText("Jobs").closest("a");
    expect(jobsLink?.className).not.toContain("nav-link-item--active");
  });

  it("renders health dots for each component", async () => {
    global.fetch = createFetchMock();
    render(<Header />);
    await waitFor(() => {
      const dots = document.querySelectorAll(".health-dot");
      expect(dots.length).toBe(4);
    });
  });

  it("sets all dots to error when health fetch fails", async () => {
    global.fetch = createFetchMock(undefined, false);
    render(<Header />);
    await waitFor(() => {
      const dots = document.querySelectorAll(".health-dot");
      expect(dots.length).toBe(4);
      dots.forEach((dot) => {
        expect((dot as HTMLElement).style.getPropertyValue("--dot-color")).toBe("#ef4444");
      });
    });
  });

  it("polls health on an interval", async () => {
    vi.useFakeTimers();
    const fetchSpy = createFetchMock();
    global.fetch = fetchSpy;

    render(<Header />);

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1500);
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(1500);
    expect(fetchSpy).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });
});

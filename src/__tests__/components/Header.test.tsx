import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionProvider } from "next-auth/react";
import Header from "@/components/Header";
import { getRuntimeConfig } from "@/lib/config";

const mockedUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockedUsePathname(),
}));

vi.mock("@/lib/config", () => ({
  getRuntimeConfig: vi.fn(),
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

function renderHeader({ useSocialLogin }: { useSocialLogin?: boolean } = {}) {
  return render(
    <SessionProvider>
      <Header useSocialLogin={useSocialLogin} />
    </SessionProvider>,
  );
}

describe("Header", () => {
  beforeEach(() => {
    mockedUsePathname.mockReturnValue("/search");
    vi.mocked(getRuntimeConfig).mockReturnValue({
      apiUrl: "http://localhost:8000",
      apiKey: "",
      useSocialLogin: false,
      useSimpleAuth: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the brand name", () => {
    global.fetch = createFetchMock();
    renderHeader();
    expect(screen.getByText("Zimmporter")).toBeInTheDocument();
  });

  it("renders nav links", () => {
    global.fetch = createFetchMock();
    renderHeader();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Jobs")).toBeInTheDocument();
  });

  it("marks the current page nav link as active", () => {
    global.fetch = createFetchMock();
    renderHeader();
    const searchLink = screen.getByText("Search").closest("a");
    expect(searchLink?.className).toContain("nav-link-item--active");
  });

  it("does not mark inactive nav links as active", () => {
    global.fetch = createFetchMock();
    renderHeader();
    const jobsLink = screen.getByText("Jobs").closest("a");
    expect(jobsLink?.className).not.toContain("nav-link-item--active");
  });

  it("renders health dots for each component", async () => {
    global.fetch = createFetchMock();
    renderHeader();
    await waitFor(() => {
      const dots = document.querySelectorAll(".health-dot");
      expect(dots.length).toBe(4);
    });
  });

  it("sets all dots to error when health fetch fails", async () => {
    global.fetch = createFetchMock(undefined, false);
    renderHeader();
    await waitFor(() => {
      const dots = document.querySelectorAll(".health-dot");
      expect(dots.length).toBe(4);
      dots.forEach((dot) => {
        expect((dot as HTMLElement).style.getPropertyValue("--dot-color")).toBe("#ef4444");
      });
    });
  });

  it("polls health on an interval", () => {
    vi.useFakeTimers();
    global.fetch = createFetchMock();

    renderHeader();

    const healthCalls = () =>
      vi
        .mocked(global.fetch)
        .mock.calls.filter(([url]) => typeof url === "string" && url.includes("/health")).length;

    expect(healthCalls()).toBe(1);

    vi.advanceTimersByTime(1500);
    expect(healthCalls()).toBe(2);

    vi.advanceTimersByTime(1500);
    expect(healthCalls()).toBe(3);

    vi.useRealTimers();
  });
});

describe("Header auth section", () => {
  beforeEach(() => {
    mockedUsePathname.mockReturnValue("/search");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not show auth UI when auth is disabled", () => {
    vi.mocked(getRuntimeConfig).mockReturnValue({
      apiUrl: "http://localhost:8000",
      apiKey: "",
      useSocialLogin: false,
      useSimpleAuth: false,
    });
    global.fetch = createFetchMock();

    renderHeader();

    expect(screen.queryByText("Login")).not.toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  it("shows Login button when auth is enabled and no session", async () => {
    vi.mocked(getRuntimeConfig).mockReturnValue({
      apiUrl: "http://localhost:8000",
      apiKey: "",
      useSocialLogin: true,
      useSimpleAuth: false,
    });
    global.fetch = createFetchMock();

    renderHeader({ useSocialLogin: true });

    await waitFor(() => {
      expect(screen.getByText("Login")).toBeInTheDocument();
    });
  });

  it("shows user info and Logout when auth is enabled and session exists", async () => {
    vi.mocked(getRuntimeConfig).mockReturnValue({
      apiUrl: "http://localhost:8000",
      apiKey: "",
      useSocialLogin: true,
      useSimpleAuth: false,
    });
    global.fetch = createFetchMock();

    render(
      <SessionProvider
        session={{
          user: { name: "Test User", email: "test@example.com" },
          accessToken: "tok",
          expires: "2099-01-01T00:00:00.000Z",
        }}
      >
        <Header useSocialLogin />
      </SessionProvider>,
    );

    const user = userEvent.setup();
    const avatar = screen.getByText("T");
    await user.click(avatar);

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("shows user group chips in the dropdown when the session has groups", async () => {
    vi.mocked(getRuntimeConfig).mockReturnValue({
      apiUrl: "http://localhost:8000",
      apiKey: "",
      useSocialLogin: true,
      useSimpleAuth: false,
    });
    global.fetch = createFetchMock();

    render(
      <SessionProvider
        session={{
          user: { name: "Test User", email: "test@example.com", groups: ["IBR", "SEB"] },
          accessToken: "tok",
          expires: "2099-01-01T00:00:00.000Z",
        }}
      >
        <Header useSocialLogin />
      </SessionProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText("T"));

    expect(screen.getByText("IBR")).toBeInTheDocument();
    expect(screen.getByText("SEB")).toBeInTheDocument();
  });

  it("does not show group chips when the session has no groups", async () => {
    vi.mocked(getRuntimeConfig).mockReturnValue({
      apiUrl: "http://localhost:8000",
      apiKey: "",
      useSocialLogin: true,
      useSimpleAuth: false,
    });
    global.fetch = createFetchMock();

    render(
      <SessionProvider
        session={{
          user: { name: "Test User", email: "test@example.com" },
          accessToken: "tok",
          expires: "2099-01-01T00:00:00.000Z",
        }}
      >
        <Header useSocialLogin />
      </SessionProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByText("T"));

    expect(screen.queryByText("IBR")).not.toBeInTheDocument();
  });

  it("shows user avatar when session has an image", async () => {
    vi.mocked(getRuntimeConfig).mockReturnValue({
      apiUrl: "http://localhost:8000",
      apiKey: "",
      useSocialLogin: true,
      useSimpleAuth: false,
    });
    global.fetch = createFetchMock();

    render(
      <SessionProvider
        session={{
          user: {
            name: "Test User",
            email: "test@example.com",
            image: "https://example.com/avatar.jpg",
          },
          accessToken: "tok",
          expires: "2099-01-01T00:00:00.000Z",
        }}
      >
        <Header useSocialLogin />
      </SessionProvider>,
    );

    await waitFor(() => {
      const img = document.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("alt", "avatar");
    });
  });
});

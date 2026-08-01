import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clearApiMocks, mockApi, mockApiGet } from "@/__tests__/helpers/api-mock";
import CookieStaleBanner from "@/components/CookieStaleBanner";
import type { CookieStatus } from "@/types/api";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const STALE: CookieStatus = {
  exists: true,
  size: 2048,
  cookie_count: 42,
  domains: [".youtube.com"],
  modified_at: "2026-08-01T12:00:00Z",
  is_stale: true,
};

const HEALTHY: CookieStatus = { ...STALE, is_stale: false };

describe("CookieStaleBanner", () => {
  beforeEach(() => {
    clearApiMocks();
  });

  it("renders nothing when cookies are healthy", async () => {
    mockApiGet(HEALTHY);
    render(<CookieStaleBanner />, { wrapper: createWrapper() });

    await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders nothing when no cookies are configured", async () => {
    mockApiGet({ ...STALE, exists: false, is_stale: false });
    render(<CookieStaleBanner />, { wrapper: createWrapper() });

    await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a warning when cookies are stale", async () => {
    mockApiGet(STALE);
    render(<CookieStaleBanner />, { wrapper: createWrapper() });

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/stale or invalid/)).toBeInTheDocument();
  });

  it("hides the banner when dismissed", async () => {
    const user = userEvent.setup();
    mockApiGet(STALE);
    render(<CookieStaleBanner />, { wrapper: createWrapper() });

    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "Dismiss cookie warning" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

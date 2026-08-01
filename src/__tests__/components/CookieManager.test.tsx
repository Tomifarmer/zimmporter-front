import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clearApiMocks, mockApi, mockApiGet, mockApiPost } from "@/__tests__/helpers/api-mock";
import CookieManager from "@/components/CookieManager";
import type { CookieStatus } from "@/types/api";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const CONFIGURED: CookieStatus = {
  exists: true,
  size: 2048,
  cookie_count: 42,
  domains: [".youtube.com", ".google.com"],
  modified_at: "2026-08-01T12:00:00Z",
};

const NOT_CONFIGURED: CookieStatus = {
  exists: false,
  size: 0,
  cookie_count: 0,
  domains: [],
  modified_at: null,
};

describe("CookieManager", () => {
  beforeEach(() => {
    clearApiMocks();
  });

  it("shows configured status when cookies exist", async () => {
    mockApiGet(CONFIGURED);
    render(<CookieManager />, { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText("Configured")).toBeInTheDocument());
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText(".youtube.com")).toBeInTheDocument();
  });

  it("shows not-configured message when no cookies file", async () => {
    mockApiGet(NOT_CONFIGURED);
    render(<CookieManager />, { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText("Not configured")).toBeInTheDocument());
    expect(screen.getByText(/No cookies configured/)).toBeInTheDocument();
  });

  it("uploads a selected file", async () => {
    const user = userEvent.setup();
    mockApiGet(NOT_CONFIGURED);
    mockApiPost(CONFIGURED);
    render(<CookieManager />, { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText("Not configured")).toBeInTheDocument());

    const file = new File(["# Netscape HTTP Cookie File\n"], "cookies.txt", {
      type: "text/plain",
    });
    await user.upload(screen.getByLabelText("Cookies file"), file);
    await user.click(screen.getByRole("button", { name: "Upload cookies" }));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/cookies", expect.any(FormData));
    });
  });

  it("shows an error when upload fails", async () => {
    const user = userEvent.setup();
    mockApiGet(NOT_CONFIGURED);
    mockApi.post.mockRejectedValue(new Error("Not a valid Netscape cookies file"));
    render(<CookieManager />, { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText("Not configured")).toBeInTheDocument());

    const file = new File(["garbage"], "cookies.txt", { type: "text/plain" });
    await user.upload(screen.getByLabelText("Cookies file"), file);
    await user.click(screen.getByRole("button", { name: "Upload cookies" }));

    await waitFor(() => {
      expect(screen.getByText("Not a valid Netscape cookies file")).toBeInTheDocument();
    });
  });
});

import { render, screen } from "@testing-library/react";
import { getRuntimeConfig } from "@/lib/config";
import AuthProvider from "@/providers/auth-provider";

vi.mock("@/lib/config", () => ({
  getRuntimeConfig: vi.fn(),
}));

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AuthProvider", () => {
  it("renders children without SessionProvider when auth is disabled", () => {
    vi.mocked(getRuntimeConfig).mockReturnValue({
      apiUrl: "http://localhost:8000",
      apiKey: "",
      authEnabled: false,
    });

    render(
      <AuthProvider>
        <div data-testid="child" />
      </AuthProvider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders children inside SessionProvider when auth is enabled", () => {
    vi.mocked(getRuntimeConfig).mockReturnValue({
      apiUrl: "http://localhost:8000",
      apiKey: "",
      authEnabled: true,
    });

    render(
      <AuthProvider>
        <div data-testid="child" />
      </AuthProvider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import AuthProvider from "@/providers/auth-provider";

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
    render(
      <AuthProvider useOidc={false}>
        <div data-testid="child" />
      </AuthProvider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders children inside SessionProvider when auth is enabled", () => {
    render(
      <AuthProvider useOidc>
        <div data-testid="child" />
      </AuthProvider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});

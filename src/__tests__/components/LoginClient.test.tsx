import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginClient from "@/app/login/client";

const mockedUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockedUseSearchParams(),
}));

const mockSignIn = vi.fn();

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

describe("LoginClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders sign-in heading and button", () => {
    mockedUseSearchParams.mockReturnValue(new URLSearchParams());

    render(<LoginClient />);

    expect(screen.getByText("Sign in")).toBeInTheDocument();
    expect(screen.getByText("Authenticate to access Zimmporter")).toBeInTheDocument();
    expect(screen.getByText("Sign in with OIDC")).toBeInTheDocument();
  });

  it("uses callbackUrl from search params when provided", async () => {
    mockedUseSearchParams.mockReturnValue(new URLSearchParams("callbackUrl=/jobs"));

    render(<LoginClient />);

    const user = userEvent.setup();
    await user.click(screen.getByText("Sign in with OIDC"));

    expect(mockSignIn).toHaveBeenCalledWith("oidc", { redirectTo: "/jobs" });
  });

  it("defaults callbackUrl to /search when no param", async () => {
    mockedUseSearchParams.mockReturnValue(new URLSearchParams());

    render(<LoginClient />);

    const user = userEvent.setup();
    await user.click(screen.getByText("Sign in with OIDC"));

    expect(mockSignIn).toHaveBeenCalledWith("oidc", { redirectTo: "/search" });
  });
});

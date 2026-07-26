import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginClient from "@/app/(auth)/login/client";

const defaultProps = { providerName: "Google", providerIcon: "pi-google" };

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

    render(<LoginClient {...defaultProps} />);

    expect(screen.getByText("Zimmporter")).toBeInTheDocument();
    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
    expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
  });

  it("uses callbackUrl from search params when provided", async () => {
    mockedUseSearchParams.mockReturnValue(new URLSearchParams("callbackUrl=/jobs"));

    render(<LoginClient {...defaultProps} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Sign in with Google/ }));

    expect(mockSignIn).toHaveBeenCalledWith("oidc", { redirectTo: "/jobs" });
  });

  it("defaults callbackUrl to /search when no param", async () => {
    mockedUseSearchParams.mockReturnValue(new URLSearchParams());

    render(<LoginClient {...defaultProps} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Sign in with Google/ }));

    expect(mockSignIn).toHaveBeenCalledWith("oidc", { redirectTo: "/search" });
  });
});

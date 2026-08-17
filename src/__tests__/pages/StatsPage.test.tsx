import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { Children, cloneElement } from "react";
import { clearApiMocks, mockApiGet } from "@/__tests__/helpers/api-mock";
import type { StatsResponse } from "@/types/api";

vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => {
      const child = Children.only(children) as React.ReactElement<{
        width?: number;
        height?: number;
      }>;
      return cloneElement(child, { width: 500, height: 300 });
    },
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

async function importStatsPage() {
  const mod = await import("@/app/(app)/stats/page");
  return mod.default;
}

function buildStats(overrides?: Partial<StatsResponse>): StatsResponse {
  return {
    jobs: {
      total: 6,
      by_status: { success: 3, failed: 2, running: 1 },
      by_type: { album: 4, playlist: 2 },
    },
    library: { albums: 12, playlists: 5, artists: 9, tracks: 148 },
    genres: [
      { genre: "Electronic", count: 4 },
      { genre: "Pop", count: 3 },
    ],
    top_users: [
      { user: "Alice", jobs: 3, tracks: 42 },
      { user: "Bob", jobs: 1, tracks: 8 },
    ],
    ...overrides,
  };
}

describe("StatsPage", () => {
  beforeEach(() => {
    clearApiMocks();
  });

  it("renders summary cards with library and job counts", async () => {
    mockApiGet(buildStats());
    const StatsPage = await importStatsPage();
    render(<StatsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Total jobs")).toBeInTheDocument();
    });
    expect(screen.getByText("Albums in library")).toBeInTheDocument();
    expect(screen.getByText("Playlists in library")).toBeInTheDocument();
    expect(screen.getByText("Artists")).toBeInTheDocument();
    expect(screen.getByText("Tracks")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("148")).toBeInTheDocument();
  });

  it("renders chart section headings", async () => {
    mockApiGet(buildStats());
    const StatsPage = await importStatsPage();
    render(<StatsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Jobs by status")).toBeInTheDocument();
    });
    expect(screen.getByText("Jobs: album vs playlist")).toBeInTheDocument();
    expect(screen.getByText("Genres")).toBeInTheDocument();
  });

  it("renders genre names and counts", async () => {
    mockApiGet(buildStats());
    const StatsPage = await importStatsPage();
    render(<StatsPage />, { wrapper: createWrapper() });

    const electronic = await screen.findAllByText("Electronic");
    expect(electronic.length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Pop")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("4")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("3")).length).toBeGreaterThan(0);
  });

  it("renders top users with job and track counts", async () => {
    mockApiGet(buildStats());
    const StatsPage = await importStatsPage();
    render(<StatsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Top users")).toBeInTheDocument();
    });
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("3 jobs · 42 tracks")).toBeInTheDocument();
    expect(screen.getByText("1 job · 8 tracks")).toBeInTheDocument();
  });

  it("shows an empty message when there is no social-login activity", async () => {
    mockApiGet(buildStats({ top_users: [] }));
    const StatsPage = await importStatsPage();
    render(<StatsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/No social-login activity yet/)).toBeInTheDocument();
    });
  });

  it("shows empty state when there is no data", async () => {
    mockApiGet(
      buildStats({
        jobs: { total: 0, by_status: {}, by_type: { album: 0, playlist: 0 } },
        library: { albums: 0, playlists: 0, artists: 0, tracks: 0 },
        genres: [],
      }),
    );
    const StatsPage = await importStatsPage();
    render(<StatsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/No data yet/)).toBeInTheDocument();
    });
  });

  it("shows error state on API failure", async () => {
    const { mockApi } = await import("@/__tests__/helpers/api-mock");
    mockApi.get.mockRejectedValue(new Error("Failed to fetch stats"));

    const StatsPage = await importStatsPage();
    render(<StatsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch stats")).toBeInTheDocument();
    });
  });
});

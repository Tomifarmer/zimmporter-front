import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { clearApiMocks, mockApiGet } from "@/__tests__/helpers/api-mock";
import { buildJob, buildSong } from "@/__tests__/helpers/factories";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

async function importJobDetailPage() {
  const mod = await import("@/app/(app)/jobs/[id]/page");
  return mod.default;
}

function renderDetail(job: ReturnType<typeof buildJob>) {
  mockApiGet(job);
  return importJobDetailPage().then((JobDetailPage) =>
    render(<JobDetailPage params={Promise.resolve({ id: String(job.job_id) })} />, {
      wrapper: createWrapper(),
    }),
  );
}

describe("JobDetailPage error column", () => {
  beforeEach(() => {
    clearApiMocks();
  });

  it("shows the error text only for failed songs", async () => {
    await renderDetail(
      buildJob({
        job_id: 1,
        status: "success",
        total_songs: 2,
        songs_downloaded: 2,
        songs: [
          buildSong({ id: 1, status: "failed", error: "Worker crashed" }),
          buildSong({ id: 2, status: "success", error: "Stale error should be hidden" }),
        ],
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Job #1")).toBeInTheDocument();
    });
    expect(screen.getByText("Worker crashed")).toBeInTheDocument();
    expect(screen.queryByText("Stale error should be hidden")).not.toBeInTheDocument();
  });

  it("does not show a stale error on a successful song", async () => {
    await renderDetail(
      buildJob({
        job_id: 2,
        status: "success",
        total_songs: 1,
        songs_downloaded: 1,
        songs: [buildSong({ id: 1, status: "success", error: "Worker crashed" })],
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Job #2")).toBeInTheDocument();
    });
    expect(screen.queryByText("Worker crashed")).not.toBeInTheDocument();
  });

  it("hides a stale job-level error when the job succeeded", async () => {
    await renderDetail(
      buildJob({
        job_id: 3,
        status: "success",
        error: "Job stalled — worker likely crashed",
        total_songs: 1,
        songs_downloaded: 1,
        songs: [buildSong({ id: 1, status: "success" })],
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Job #3")).toBeInTheDocument();
    });
    expect(screen.queryByText(/Job stalled — worker likely crashed/i)).not.toBeInTheDocument();
  });

  it("shows the job-level error only for failed jobs", async () => {
    await renderDetail(
      buildJob({
        job_id: 4,
        status: "failed",
        error: "Job stalled — worker likely crashed",
        total_songs: 1,
        songs_downloaded: 0,
        songs: [buildSong({ id: 1, status: "failed" })],
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Job #4")).toBeInTheDocument();
    });
    expect(screen.getByText(/Job stalled — worker likely crashed/i)).toBeInTheDocument();
  });
});

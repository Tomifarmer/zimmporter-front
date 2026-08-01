import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clearApiMocks, mockApi, mockApiGet } from "@/__tests__/helpers/api-mock";
import { buildJob, buildSong } from "@/__tests__/helpers/factories";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

async function importJobsPage() {
  const mod = await import("@/app/(app)/jobs/page");
  return mod.default;
}

describe("JobsPage", () => {
  beforeEach(() => {
    clearApiMocks();
  });

  it("renders the title and shows loading state", async () => {
    const JobsPage = await importJobsPage();
    render(<JobsPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Jobs")).toBeInTheDocument();
  });

  it("renders stat pills when jobs are loaded", async () => {
    const jobs = [
      buildJob({ job_id: 1, status: "running", songs_downloaded: 5, total_songs: 10 }),
      buildJob({ job_id: 2, status: "success", songs_downloaded: 10, total_songs: 10, songs: [] }),
    ];
    mockApiGet(jobs);

    const JobsPage = await importJobsPage();
    render(<JobsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Total")).toBeInTheDocument();
      expect(screen.getByText("Completed")).toBeInTheDocument();
      expect(screen.getAllByText("Running").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders a list of job cards", async () => {
    const jobs = [
      buildJob({ job_id: 10, status: "running", artist: "Artist X", album_name: "Album X" }),
      buildJob({ job_id: 11, status: "success", artist: "Artist Y", album_name: "Album Y" }),
    ];
    mockApiGet(jobs);

    const JobsPage = await importJobsPage();
    render(<JobsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Job #10")).toBeInTheDocument();
      expect(screen.getByText("Job #11")).toBeInTheDocument();
      expect(screen.getByText("Artist X")).toBeInTheDocument();
      expect(screen.getByText("Artist Y")).toBeInTheDocument();
    });
  });

  it("shows empty state when no jobs exist", async () => {
    mockApiGet([]);

    const JobsPage = await importJobsPage();
    render(<JobsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/No jobs yet/)).toBeInTheDocument();
    });
  });

  it("shows empty state when filter matches nothing", async () => {
    const user = userEvent.setup();
    const jobs = [buildJob({ job_id: 1, status: "success" })];
    mockApiGet(jobs);

    const JobsPage = await importJobsPage();
    render(<JobsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Job #1")).toBeInTheDocument();
    });

    const failedButton = screen.getByText("Failed");
    await user.click(failedButton);

    await waitFor(() => {
      expect(screen.getByText(/No jobs match/)).toBeInTheDocument();
    });
  });

  it("shows error state on API failure", async () => {
    mockApi.get.mockRejectedValue(new Error("Failed to fetch jobs"));

    const JobsPage = await importJobsPage();
    render(<JobsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch jobs")).toBeInTheDocument();
    });
  });

  it("paginates: shows Previous disabled on page 1", async () => {
    const jobs = Array.from({ length: 20 }, (_, i) => buildJob({ job_id: i + 1 }));
    mockApiGet(jobs);

    const JobsPage = await importJobsPage();
    render(<JobsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Previous")).toBeDisabled();
    });
  });

  it("paginates: Previous enabled after advancing", async () => {
    const user = userEvent.setup();
    const jobs = Array.from({ length: 20 }, (_, i) => buildJob({ job_id: i + 1 }));
    mockApiGet(jobs);

    const JobsPage = await importJobsPage();
    render(<JobsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Page 1")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Next"));
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    expect(screen.getByText("Previous")).not.toBeDisabled();
  });

  it("shows auto-refreshing indicator when fetching", async () => {
    mockApiGet([buildJob()]);

    const JobsPage = await importJobsPage();
    render(<JobsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Auto-refreshing")).toBeInTheDocument();
    });
  });
});

describe("JobsPage retry selection", () => {
  beforeEach(() => {
    clearApiMocks();
  });

  const retryableJob = (id: number) =>
    buildJob({
      job_id: id,
      status: "failed",
      error: "boom",
      songs: [buildSong({ id: 1, status: "failed", error: "boom" })],
    });

  it("shows a checkbox only for retryable jobs (with failed songs)", async () => {
    mockApiGet([retryableJob(1), buildJob({ job_id: 2, status: "success", songs: [] })]);

    const JobsPage = await importJobsPage();
    render(<JobsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    });
  });

  it("retry button is disabled when nothing is selected", async () => {
    mockApiGet([retryableJob(1)]);

    const JobsPage = await importJobsPage();
    render(<JobsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Retry selected (0)")).toBeDisabled();
    });
  });

  it("posts to /jobs/{id}/retry for each selected job and clears selection", async () => {
    mockApiGet([retryableJob(1), retryableJob(2)]);
    mockApi.post.mockResolvedValue({ data: { job_id: 1, status: "running" } });
    const user = userEvent.setup();

    const JobsPage = await importJobsPage();
    render(<JobsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    });

    await user.click(screen.getAllByRole("checkbox")[1]);
    expect(screen.getByText("Retry selected (1)")).toBeEnabled();

    await user.click(screen.getByText("Retry selected (1)"));

    await waitFor(() => {
      expect(screen.getByText("Retried 1 job(s).")).toBeInTheDocument();
    });
    expect(mockApi.post).toHaveBeenCalledWith("/jobs/1/retry");
    expect(screen.getByText("Retry selected (0)")).toBeDisabled();
  });

  it("select all selects every retryable job on the page", async () => {
    mockApiGet([
      retryableJob(1),
      retryableJob(2),
      buildJob({ job_id: 3, status: "success", songs: [] }),
    ]);
    const user = userEvent.setup();

    const JobsPage = await importJobsPage();
    render(<JobsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    });

    await user.click(screen.getByText("Select all"));
    expect(screen.getByText("Retry selected (2)")).toBeEnabled();
  });

  it("shows error feedback when a retry fails", async () => {
    mockApiGet([retryableJob(1)]);
    mockApi.post.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();

    const JobsPage = await importJobsPage();
    render(<JobsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    });

    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.click(screen.getByText("Retry selected (1)"));

    await waitFor(() => {
      expect(screen.getByText("0 job(s) retried, 1 failed.")).toBeInTheDocument();
    });
  });
});

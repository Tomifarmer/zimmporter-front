import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clearApiMocks, mockApi, mockApiGet } from "@/__tests__/helpers/api-mock";
import { buildJob, buildSong } from "@/__tests__/helpers/factories";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

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

describe("JobDetailPage retry", () => {
  beforeEach(() => {
    clearApiMocks();
  });

  it("shows a retry button for a failed job with no failed songs", async () => {
    await renderDetail(
      buildJob({
        job_id: 10,
        status: "failed",
        error: "Aborted before songs were inserted",
        total_songs: 0,
        songs_downloaded: 0,
        songs: [],
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Job #10")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Retry job/ })).toBeInTheDocument();
  });

  it("hides the retry button for a successful job", async () => {
    await renderDetail(
      buildJob({
        job_id: 11,
        status: "success",
        total_songs: 1,
        songs_downloaded: 1,
        songs: [buildSong({ id: 1, status: "success" })],
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("Job #11")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /Retry/ })).not.toBeInTheDocument();
  });

  it("posts to /jobs/{id}/retry when the retry button is clicked", async () => {
    mockApi.post.mockResolvedValue({ data: { job_id: 12, status: "running" } });
    await renderDetail(
      buildJob({
        job_id: 12,
        status: "failed",
        error: "boom",
        total_songs: 0,
        songs_downloaded: 0,
        songs: [],
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Retry job/ })).toBeInTheDocument();
    });

    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Retry job/ }));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith("/jobs/12/retry");
    });
  });
});

describe("JobDetailPage delete", () => {
  beforeEach(() => {
    clearApiMocks();
    pushMock.mockClear();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the delete button when the job is deletable", async () => {
    await renderDetail(buildJob({ job_id: 20, can_delete: true, songs: [] }));

    await waitFor(() => {
      expect(screen.getByText("Job #20")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Delete/ })).toBeInTheDocument();
  });

  it("hides the delete button when the job is not deletable", async () => {
    await renderDetail(buildJob({ job_id: 21, can_delete: false, songs: [] }));

    await waitFor(() => {
      expect(screen.getByText("Job #21")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument();
  });

  it("calls DELETE and navigates back to the jobs list on success", async () => {
    mockApi.delete.mockResolvedValue({ data: { job_id: 22, status: "deleted" } });
    const user = userEvent.setup();
    await renderDetail(buildJob({ job_id: 22, can_delete: true, songs: [] }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Delete/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Delete/ }));

    await waitFor(() => {
      expect(mockApi.delete).toHaveBeenCalledWith("/jobs/22");
      expect(pushMock).toHaveBeenCalledWith("/jobs");
    });
  });

  it("does not delete when confirmation is dismissed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    await renderDetail(buildJob({ job_id: 23, can_delete: true, songs: [] }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Delete/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Delete/ }));

    expect(mockApi.delete).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});

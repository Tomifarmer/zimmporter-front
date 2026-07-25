import { render, screen } from "@testing-library/react";
import JobRow from "@/components/JobRow";
import { buildJob } from "@/__tests__/helpers/factories";

describe("JobRow", () => {
  it("renders job ID and type badge", () => {
    const job = buildJob({ job_id: 42, job_type: "playlist" });
    render(<JobRow job={job} />);
    expect(screen.getByText("Job #42")).toBeInTheDocument();
    expect(screen.getByText("playlist")).toBeInTheDocument();
  });

  it("renders artist and album name when provided", () => {
    const job = buildJob({ artist: "Some Artist", album_name: "Some Album" });
    render(<JobRow job={job} />);
    expect(screen.getByText("Some Artist")).toBeInTheDocument();
    expect(screen.getByText("Some Album")).toBeInTheDocument();
  });

  it("renders progress bar with correct fraction", () => {
    const job = buildJob({ songs_downloaded: 3, total_songs: 10 });
    render(<JobRow job={job} />);
    expect(screen.getByText("3/10")).toBeInTheDocument();
  });

  it("shows running indicator for running jobs", () => {
    const job = buildJob({ status: "running" });
    render(<JobRow job={job} />);
    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("shows running indicator for pending jobs", () => {
    const job = buildJob({ status: "pending" });
    render(<JobRow job={job} />);
    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("shows error section for failed jobs with error message", () => {
    const job = buildJob({ status: "failed", error: "Something went wrong" });
    render(<JobRow job={job} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("shows StatusBadge with 'partial' when success but songs have failures", () => {
    const job = buildJob({
      status: "success",
      songs: [
        { id: 1, title: "S1", artist: "A", album: "B", track_number: 1, status: "success", s3_path: null, error: null },
        { id: 2, title: "S2", artist: "A", album: "B", track_number: 2, status: "failed", s3_path: null, error: "err" },
      ],
    });
    render(<JobRow job={job} />);
    expect(screen.getByText("partial")).toBeInTheDocument();
  });

  it("renders relative created time", () => {
    const recent = new Date(Date.now() - 30_000).toISOString();
    const job = buildJob({ created_at: recent, updated_at: recent });
    render(<JobRow job={job} />);
    expect(screen.getByText(/just now/)).toBeInTheDocument();
  });

  it("does not render progress section when total_songs is 0", () => {
    const job = buildJob({ total_songs: 0, songs_downloaded: 0, songs: [] });
    render(<JobRow job={job} />);
    expect(screen.queryByText("0/0")).not.toBeInTheDocument();
  });

  it("links to the job detail page", () => {
    const job = buildJob({ job_id: 7 });
    render(<JobRow job={job} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/jobs/7");
  });
});

"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import JobRow from "@/components/JobRow";
import { COLORS } from "@/config/colors";
import { api } from "@/lib/api";
import type { JobStatusResponse } from "@/types/api";

type StatusFilter = "all" | "pending" | "running" | "success" | "failed" | "partial";

const FILTER_OPTIONS: { label: string; value: StatusFilter; color: string }[] = [
  { label: "Total", value: "all", color: COLORS.blue },
  { label: "Running", value: "running", color: COLORS.turquoise },
  { label: "Completed", value: "success", color: "#22c55e" },
  { label: "Partial", value: "partial", color: "#f59e0b" },
  { label: "Failed", value: "failed", color: "#ef4444" },
];

export default function JobsPage() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const limit = 20;

  const jobsQuery = useQuery<JobStatusResponse[]>({
    queryKey: ["jobs", page, limit],
    queryFn: async () => {
      const { data } = await api.get<JobStatusResponse[]>("/jobs", {
        params: { limit, offset: page * limit },
      });
      return data.sort((a, b) => b.job_id - a.job_id);
    },
    refetchInterval: 5000,
  });

  const jobs = jobsQuery.data || [];

  const stats = useMemo(() => {
    const total = jobs.length;
    const pending = jobs.filter((j) => j.status === "pending").length;
    const running = jobs.filter((j) => j.status === "running" || j.status === "pending").length;
    const success = jobs.filter((j) => j.status === "success").length;
    const failed = jobs.filter((j) => j.status === "failed").length;
    const partial = jobs.filter((j) => j.songs.some((s) => s.status === "failed")).length;
    return { total, pending, running, success, failed, partial };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (statusFilter === "all") return jobs;
    if (statusFilter === "partial")
      return jobs.filter((j) => j.songs.some((s) => s.status === "failed"));
    return jobs.filter((j) => j.status === statusFilter);
  }, [jobs, statusFilter]);

  const pills = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: stats.total,
      pending: stats.pending,
      running: stats.running,
      success: stats.success,
      partial: stats.partial,
      failed: stats.failed,
    };
    return FILTER_OPTIONS.map((opt) => ({ ...opt, count: counts[opt.value] }));
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="jobs-header-row">
        <h1 className="jobs-title">Jobs</h1>
        {jobsQuery.isFetching && (
          <span className="jobs-refreshing-indicator">
            <span className="jobs-refreshing-dot animate-pulse-fill" />
            Auto-refreshing
          </span>
        )}
      </div>

      {jobs.length > 0 && (
        <div className="jobs-toolbar-row">
          {pills.map((pill) => {
            const active = statusFilter === pill.value;
            return (
              <button
                type="button"
                key={pill.value}
                aria-pressed={active}
                onClick={() => {
                  setPage(0);
                  setStatusFilter(pill.value);
                }}
                className="jobs-toolbar-pill"
                style={
                  {
                    "--toolbar-border": active ? pill.color : "#334155",
                    "--toolbar-bg": active ? `${pill.color}22` : "#1e293b",
                    "--toolbar-color": active ? pill.color : "#94a3b8",
                    "--toolbar-dot": pill.color,
                    "--toolbar-weight": active ? 600 : 400,
                  } as React.CSSProperties
                }
              >
                <span className="jobs-toolbar-dot" />
                <span className="jobs-toolbar-label">{pill.label}</span>
                <span className="jobs-toolbar-count">{pill.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {jobsQuery.isLoading && (
        <div className="jobs-loading-wrapper">
          <i className="pi pi-spin pi-spinner jobs-loading-icon" />
        </div>
      )}

      {jobsQuery.isError && <div className="jobs-error-box">{jobsQuery.error.message}</div>}

      {!jobsQuery.isLoading && !jobsQuery.isError && filteredJobs.length === 0 && (
        <div className="jobs-empty-state">
          <i className="pi pi-inbox jobs-empty-icon" />
          <span className="jobs-empty-text">
            {jobs.length === 0
              ? "No jobs yet. Start a download from the search page."
              : "No jobs match the selected filter."}
          </span>
        </div>
      )}

      {filteredJobs.length > 0 && (
        <div>
          {filteredJobs.map((job) => (
            <div key={job.job_id} className="jobs-card-wrapper">
              <JobRow job={job} />
            </div>
          ))}
        </div>
      )}

      {jobs.length > 0 && (
        <div className="jobs-pagination-row">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="jobs-page-btn"
            style={
              {
                "--btn-border": page === 0 ? "#1e293b" : COLORS.blue,
                "--btn-bg": page === 0 ? "#1e293b" : "transparent",
                "--btn-color": page === 0 ? "#475569" : "#ffffff",
                "--btn-cursor": page === 0 ? "not-allowed" : "pointer",
              } as React.CSSProperties
            }
          >
            Previous
          </button>
          <span className="jobs-page-num">Page {page + 1}</span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={jobs.length < limit}
            className="jobs-page-btn"
            style={
              {
                "--btn-border": jobs.length < limit ? "#1e293b" : COLORS.blue,
                "--btn-bg": jobs.length < limit ? "#1e293b" : "transparent",
                "--btn-color": jobs.length < limit ? "#475569" : "#ffffff",
                "--btn-cursor": jobs.length < limit ? "not-allowed" : "pointer",
              } as React.CSSProperties
            }
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import JobRow from "@/components/JobRow";
import { COLORS } from "@/config/colors";
import { api } from "@/lib/api";
import type { JobStatusResponse } from "@/types/api";

type StatusFilter = "all" | "pending" | "running" | "success" | "failed" | "partial";

const FILTER_OPTIONS: { label: string; value: StatusFilter; color: string }[] = [
  { label: "All", value: "all", color: COLORS.blue },
  { label: "Running", value: "running", color: COLORS.turquoise },
  { label: "Success", value: "success", color: "#22c55e" },
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
    const running = jobs.filter((j) => j.status === "running" || j.status === "pending").length;
    const success = jobs.filter((j) => j.status === "success").length;
    const failed = jobs.filter((j) => j.status === "failed").length;
    const partial = jobs.filter((j) => j.songs.some((s) => s.status === "failed")).length;
    return { total, running, success, failed, partial };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (statusFilter === "all") return jobs;
    if (statusFilter === "partial")
      return jobs.filter((j) => j.songs.some((s) => s.status === "failed"));
    return jobs.filter((j) => j.status === statusFilter);
  }, [jobs, statusFilter]);

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
        <div className="jobs-stats-row">
          {[
            { label: "Total", value: stats.total, color: COLORS.blue },
            { label: "Running", value: stats.running, color: COLORS.turquoise },
            { label: "Completed", value: stats.success, color: "#22c55e" },
            { label: "Partial", value: stats.partial, color: "#f59e0b" },
            { label: "Failed", value: stats.failed, color: "#ef4444" },
          ].map((stat) => (
            <div key={stat.label} className="jobs-stat-pill">
              <div
                className="jobs-stat-dot"
                style={{ "--stat-color": stat.color } as React.CSSProperties}
              />
              <span className="jobs-stat-label">{stat.label}</span>
              <span className="jobs-stat-value">{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {jobs.length > 0 && (
        <div className="jobs-filter-row">
          {FILTER_OPTIONS.map((opt) => {
            const active = statusFilter === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => {
                  setPage(0);
                  setStatusFilter(opt.value);
                }}
                className="jobs-filter-btn"
                style={
                  {
                    "--filter-border": active ? opt.color : "#334155",
                    "--filter-bg": active ? `${opt.color}22` : "transparent",
                    "--filter-color": active ? opt.color : "#64748b",
                    "--filter-weight": active ? 600 : 400,
                  } as React.CSSProperties
                }
              >
                {opt.label}
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

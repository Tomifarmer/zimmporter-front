"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import JobRow from "@/components/JobRow";
import { COLORS } from "@/config/colors";
import { api } from "@/lib/api";
import type { JobStatsResponse, JobStatusResponse } from "@/types/api";

function isPartial(job: JobStatusResponse): boolean {
  return job.status === "success" && job.songs.some((s) => s.status === "failed");
}

function isRetryable(job: JobStatusResponse): boolean {
  return job.status === "failed" || job.songs.some((s) => s.status === "failed");
}

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
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<"retry" | "delete" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const queryClient = useQueryClient();
  const limit = 20;

  const jobsQuery = useQuery<JobStatusResponse[]>({
    queryKey: ["jobs", page, limit, statusFilter],
    queryFn: async () => {
      const { data } = await api.get<JobStatusResponse[]>("/jobs", {
        params: {
          limit,
          offset: page * limit,
          status: statusFilter === "all" ? undefined : statusFilter,
        },
      });
      return data.sort((a, b) => b.job_id - a.job_id);
    },
    refetchInterval: 5000,
  });

  const jobs = jobsQuery.data || [];

  const statsQuery = useQuery<JobStatsResponse>({
    queryKey: ["job-stats"],
    queryFn: async () => {
      const { data } = await api.get<JobStatsResponse>("/jobs/stats");
      return data;
    },
    refetchInterval: 5000,
  });

  const pageStats = useMemo(() => {
    const total = jobs.length;
    const pending = jobs.filter((j) => j.status === "pending").length;
    const running = jobs.filter((j) => j.status === "running" || j.status === "pending").length;
    const success = jobs.filter((j) => j.status === "success" && !isPartial(j)).length;
    const failed = jobs.filter((j) => j.status === "failed").length;
    const partial = jobs.filter((j) => j.songs.some((s) => s.status === "failed")).length;
    return { total, pending, running, success, failed, partial };
  }, [jobs]);

  const stats =
    statsQuery.data && typeof statsQuery.data === "object" && "total" in statsQuery.data
      ? statsQuery.data
      : pageStats;

  const filteredJobs = useMemo(() => {
    if (statusFilter === "all") return jobs;
    if (statusFilter === "partial")
      return jobs.filter((j) => j.songs.some((s) => s.status === "failed"));
    return jobs.filter((j) => j.status === statusFilter && !isPartial(j));
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

  const retryableIds = useMemo(
    () => filteredJobs.filter(isRetryable).map((j) => j.job_id),
    [filteredJobs],
  );
  const deletableIds = useMemo(
    () => filteredJobs.filter((j) => j.can_delete).map((j) => j.job_id),
    [filteredJobs],
  );
  const selectableIds = useMemo(
    () => [...new Set([...retryableIds, ...deletableIds])],
    [retryableIds, deletableIds],
  );
  const selectedRetryCount = useMemo(
    () => [...selected].filter((id) => retryableIds.includes(id)).length,
    [selected, retryableIds],
  );
  const selectedDeleteCount = useMemo(
    () => [...selected].filter((id) => deletableIds.includes(id)).length,
    [selected, deletableIds],
  );

  const allSelectedOnPage =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  const toggleSelect = (jobId: number) => {
    setFeedback(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    setFeedback(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage)
        selectableIds.forEach((id) => {
          next.delete(id);
        });
      else
        selectableIds.forEach((id) => {
          next.add(id);
        });
      return next;
    });
  };

  const clearSelection = () => {
    setFeedback(null);
    setSelected(new Set());
  };

  const refreshJobs = async () => {
    await queryClient.invalidateQueries({ queryKey: ["jobs", page, limit, statusFilter] });
    await queryClient.invalidateQueries({ queryKey: ["job-stats"] });
  };

  const retrySelected = async () => {
    const ids = [...selected].filter((id) => retryableIds.includes(id));
    if (ids.length === 0 || busy) return;
    setBusy("retry");
    setFeedback(null);
    const results = await Promise.allSettled(ids.map((id) => api.post(`/jobs/${id}/retry`)));
    const failedCount = results.filter((r) => r.status === "rejected").length;
    setSelected(new Set());
    await refreshJobs();
    setBusy(null);
    setFeedback({
      text:
        failedCount === 0
          ? `Retried ${ids.length} job(s).`
          : `${ids.length - failedCount} job(s) retried, ${failedCount} failed.`,
      isError: failedCount > 0,
    });
  };

  const requestDeleteJob = (jobId: number) => {
    if (busy) return;
    setFeedback(null);
    setDeleteTarget([jobId]);
  };

  const requestDeleteSelected = () => {
    const ids = [...selected].filter((id) => deletableIds.includes(id));
    if (ids.length === 0 || busy) return;
    setFeedback(null);
    setDeleteTarget(ids);
  };

  const confirmDelete = async () => {
    const ids = deleteTarget;
    if (!ids || ids.length === 0 || deleting) return;
    setDeleting(true);
    setFeedback(null);
    try {
      const results = await Promise.allSettled(ids.map((id) => api.delete(`/jobs/${id}`)));
      const failedCount = results.filter((r) => r.status === "rejected").length;
      setSelected((prev) => new Set([...prev].filter((id) => !ids.includes(id))));
      await refreshJobs();
      setFeedback({
        text:
          failedCount === 0
            ? `Deleted ${ids.length} job(s).`
            : `${ids.length - failedCount} job(s) deleted, ${failedCount} failed.`,
        isError: failedCount > 0,
      });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

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

      {stats.total > 0 && (
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

      {jobs.length > 0 && selectableIds.length > 0 && (
        <div className="jobs-select-toolbar-row">
          <button
            type="button"
            onClick={toggleSelectAllOnPage}
            disabled={busy !== null}
            className="jobs-select-btn"
          >
            {allSelectedOnPage ? "Deselect all" : "Select all"}
          </button>
          <button
            type="button"
            onClick={clearSelection}
            disabled={busy !== null || selected.size === 0}
            className="jobs-select-btn"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={retrySelected}
            disabled={selectedRetryCount === 0 || busy !== null}
            className="jobs-toolbar-retry-btn"
          >
            {busy === "retry" ? "Retrying\u2026" : `Retry selected (${selectedRetryCount})`}
          </button>
          {deletableIds.length > 0 && (
            <button
              type="button"
              onClick={requestDeleteSelected}
              disabled={selectedDeleteCount === 0 || busy !== null || deleting}
              className="jobs-toolbar-delete-btn"
            >
              Delete selected ({selectedDeleteCount})
            </button>
          )}
        </div>
      )}

      {feedback && (
        <div className={`jobs-feedback${feedback.isError ? " jobs-feedback--error" : ""}`}>
          <span>{feedback.text}</span>
          <button type="button" className="jobs-feedback-dismiss" onClick={() => setFeedback(null)}>
            ×
          </button>
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
            {stats.total === 0
              ? "No jobs yet. Start a download from the search page."
              : "No jobs match the selected filter."}
          </span>
        </div>
      )}

      {filteredJobs.length > 0 && (
        <div>
          {filteredJobs.map((job) => (
            <div key={job.job_id} className="jobs-card-wrapper">
              <JobRow
                job={job}
                selectable={isRetryable(job) || Boolean(job.can_delete)}
                checked={selected.has(job.job_id)}
                onToggleSelect={() => toggleSelect(job.job_id)}
                onDelete={job.can_delete ? () => requestDeleteJob(job.job_id) : undefined}
              />
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

      <ConfirmDeleteDialog
        visible={deleteTarget !== null}
        title={deleteTarget && deleteTarget.length > 1 ? "Delete jobs" : "Delete job"}
        message={
          deleteTarget
            ? `Delete ${
                deleteTarget.length > 1
                  ? `${deleteTarget.length} selected job(s)`
                  : `job #${deleteTarget[0]}`
              }? This cannot be undone.`
            : ""
        }
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

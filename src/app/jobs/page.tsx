"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { JobStatusResponse } from "@/types/api";
import { api } from "@/lib/api";
import { COLORS } from "@/config/colors";
import JobRow from "@/components/JobRow";

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
      return data;
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
    if (statusFilter === "partial") return jobs.filter((j) => j.songs.some((s) => s.status === "failed"));
    return jobs.filter((j) => j.status === statusFilter);
  }, [jobs, statusFilter]);

  return (
    <div className="space-y-6">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Jobs</h1>
        {jobsQuery.isFetching && (
          <span style={{ color: COLORS.turquoise, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span className="animate-pulse-fill" style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: COLORS.turquoise, display: 'inline-block' }} />
            Auto-refreshing
          </span>
        )}
      </div>

      {jobs.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {[
            { label: "Total", value: stats.total, color: COLORS.blue },
            { label: "Running", value: stats.running, color: COLORS.turquoise },
            { label: "Completed", value: stats.success, color: "#22c55e" },
            { label: "Partial", value: stats.partial, color: "#f59e0b" },
            { label: "Failed", value: stats.failed, color: "#ef4444" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: '#1e293b',
                border: `1px solid #334155`,
              }}
            >
              <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: stat.color }} />
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{stat.label}</span>
              <span style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 600 }}>{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {jobs.length > 0 && (
        <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem' }}>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setPage(0); setStatusFilter(opt.value); }}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: '999px',
                border: `1px solid ${statusFilter === opt.value ? opt.color : '#334155'}`,
                backgroundColor: statusFilter === opt.value ? `${opt.color}22` : 'transparent',
                color: statusFilter === opt.value ? opt.color : '#64748b',
                fontSize: '0.8125rem',
                fontWeight: statusFilter === opt.value ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {jobsQuery.isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: COLORS.blue }}></i>
        </div>
      )}

      {jobsQuery.isError && (
        <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#1e293b', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.875rem' }}>
          {jobsQuery.error.message}
        </div>
      )}

      {!jobsQuery.isLoading && !jobsQuery.isError && filteredJobs.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '1rem' }}>
          <i className="pi pi-inbox" style={{ fontSize: '3rem', color: '#334155' }}></i>
          <span style={{ color: '#64748b', fontSize: '0.9375rem' }}>
            {jobs.length === 0 ? "No jobs yet. Start a download from the search page." : "No jobs match the selected filter."}
          </span>
        </div>
      )}

      {filteredJobs.length > 0 && (
        <div>
          {filteredJobs.map((job) => (
            <div key={job.job_id} style={{ marginBottom: '1rem' }}>
              <JobRow job={job} />
            </div>
          ))}
        </div>
      )}

      {jobs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', paddingTop: '0.5rem' }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '0.375rem',
              border: `1px solid ${page === 0 ? '#1e293b' : COLORS.blue}`,
              backgroundColor: page === 0 ? '#1e293b' : 'transparent',
              color: page === 0 ? '#475569' : '#ffffff',
              fontSize: '0.8125rem',
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            Previous
          </button>
          <span style={{ color: '#64748b', fontSize: '0.8125rem', padding: '0.375rem 0.5rem' }}>
            Page {page + 1}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={jobs.length < limit}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '0.375rem',
              border: `1px solid ${jobs.length < limit ? '#1e293b' : COLORS.blue}`,
              backgroundColor: jobs.length < limit ? '#1e293b' : 'transparent',
              color: jobs.length < limit ? '#475569' : '#ffffff',
              fontSize: '0.8125rem',
              cursor: jobs.length < limit ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { JobStatusResponse } from "@/types/api";
import { api } from "@/lib/api";
// Unused imports removed to fix lint errors

export default function DashboardPage() {
  const { jobsQuery, totalQuery, runningQuery } = useJobsStats();

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '600px' }}>
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Jobs Overview */}
        <section className="mb-4">
          <h2 className="dashboard-section-title">Jobs Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <StatCard label="Total Jobs" value={totalQuery.data?.length ?? "..."} />
            <StatCard label="Running" value={runningQuery.data?.length ?? "..."} />
            <LastJobStatCard lastStatus={(jobsQuery.data?.[0]?.status ?? "pending") as string} />
          </div>
        </section>

        {/* Recent Jobs */}
        <section className="mb-4">
          <h2 className="dashboard-section-title">Recent Jobs</h2>
          {jobsQuery.data?.slice(0, 5).map((job) => (
            <a key={job.job_id} href={'/jobs/' + job.job_id} style={{ textDecoration: 'none', color: '#e2e8f0' }}>
              <div className="dashboard-job-card">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 py-1 px-2">
                  {/* Job ID */}
                  <span className="text-white fs-6 fw-semibold d-flex align-items-center gap-1">
                    <i className="pi pi-hashtag"></i> {job.job_id}
                  </span>
                  {/* Type + Name */}
                  <div className="d-flex align-items-baseline gap-2">
                    {job.job_type === "album" && (
                      <>
                        <span style={{ display: 'inline-block', lineHeight: '1.5rem' }}><i className="pi pi-book text-turquoise"></i> Album</span>
                      </>
                    )}
                    {job.job_type === "playlist" && (
                      <>
                        <span style={{ display: 'inline-block', lineHeight: '1.5rem' }}><i className="pi pi-book text-turquoise"></i> Playlist</span>
                      </>
                    )}
                  </div>
                  {/* Artist */}
                  {job.artist && (
                    <>
                      <span className="text-gray-400">
                        <i className="pi pi-user text-turquoise"></i>{' '}
                        {job.artist}
                      </span>
                    </>
                  )}
                  {/* Album name (centered) */}
                  {job.album_name || job.browse_id ? (
                    <span className="text-gray-400">
                      <i className="pi pi-tag text-turquoise"></i>{' '}
                      {job.album_name || job.browse_id}
                    </span>
                  ) : null}
                  {/* Songs */}
                  {job.total_songs > 0 && (
                    <>
                      <span className="text-gray-400">
                        {job.songs_downloaded}/{job.total_songs} songs
                      </span>
                    </>
                  )}
                  {/* Status */}
                  <div className="d-flex items-center gap-2 ml-auto">
                    {job.status === "success" && (
                      <i className="pi pi-check-circle text-green-500"></i>
                    )}
                    {job.status === "failed" && (
                      <i className="pi pi-times-circle text-red-500"></i>
                    )}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </section>

      </div>
    </div>
  );
}

function useJobsStats() {
  const jobsQuery = useQuery({
    queryKey: ["jobs", 0, 50],
    queryFn: async () => {
      const { data } = await api.get<JobStatusResponse[]>("/jobs?limit=50");
      return data;
    },
    refetchInterval: 5000,
  });

  const totalQuery = useQuery({
    queryKey: ["jobs-total"],
    queryFn: async () => {
      const { data } = await api.get<JobStatusResponse[]>("/jobs?limit=1000");
      return data;
    },
    refetchInterval: 10000,
  });

  const runningQuery = useQuery({
    queryKey: ["running-jobs"],
    queryFn: async () => {
      const { data } = await api.get<JobStatusResponse[]>("/jobs?limit=100");
      return data.filter((j) => j.status === "running");
    },
    refetchInterval: 5000,
  });

  return { jobsQuery, totalQuery, runningQuery };
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{value}</span>
    </div>
  );
}

function LastJobStatCard({ lastStatus }: { lastStatus: string }) {
  const isSuccess = lastStatus === "success";
  const isFailed = lastStatus === "failed";
  
  return (
    <div className="stat-card">
      <span className="stat-card-label">Last Job</span>
      <span className="stat-card-value" style={{ 
        color: isSuccess ? '#22c55e' : isFailed ? '#ef4444' : undefined,
        borderColor: isSuccess || isFailed ? (isSuccess ? '#22c55e' : '#ef4444') : undefined 
      }}>
        {lastStatus ?? "..."}
      </span>
    </div>
  );
}


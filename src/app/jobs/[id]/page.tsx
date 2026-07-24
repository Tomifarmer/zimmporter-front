"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useJobPolling } from "@/hooks/useJobPolling";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { COLORS } from "@/config/colors";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const jobIdPromise = params;
  return <JobDetailContent jobIdPromise={jobIdPromise} />;
}

function JobDetailContent({ jobIdPromise }: { jobIdPromise: Promise<{ id: string }> }) {
  const [resolved, setResolved] = useState(false);
  const [jobId, setJobId] = useState<number | undefined>();

  useEffect(() => {
    let mounted = true;
    jobIdPromise.then((p) => {
      if (mounted) {
        setJobId(Number(p.id));
        setResolved(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [jobIdPromise]);

  const { data, isLoading, isError, error } = useJobPolling(jobId);
  const queryClient = useQueryClient();

  const retryMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/jobs/${jobId}/retry`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  if (!resolved) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: COLORS.blue }}></i></div>;
  }

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: COLORS.blue }}></i></div>;
  if (isError) return <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#1e293b', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.875rem' }}>{error.message}</div>;
  if (!data) return <div style={{ color: '#64748b', textAlign: 'center', padding: '3rem 0' }}>Job not found.</div>;

  const pct = data.total_songs > 0 ? Math.round((data.songs_downloaded / data.total_songs) * 100) : 0;
  const isRunning = data.status === "running" || data.status === "pending";
  const isSuccess = data.status === "success";
  const isFailed = data.status === "failed";
  const failedCount = data.songs.filter((s) => s.status === "failed").length;
  const displayStatus = isSuccess && failedCount > 0 ? "partial" : data.status;

  return (
    <div className="space-y-6">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <a href="/jobs" style={{ color: '#64748b', fontSize: '0.8125rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <i className="pi pi-arrow-left" style={{ fontSize: '0.75rem' }}></i>
          Jobs
        </a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS.turquoise, margin: 0 }}>
          Job #{data.job_id}
        </h1>
        <StatusBadge status={displayStatus} />
        {isRunning && (
          <span style={{ color: COLORS.turquoise, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span className="animate-pulse-fill" style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: COLORS.turquoise, display: 'inline-block' }} />
            Polling for updates
          </span>
        )}
      </div>

      <div className="row g-3" style={{ marginBottom: '1rem' }}>
        <div className="col-12 col-sm-6">
          <InfoBox label="Type" value={data.job_type} />
        </div>
        <div className="col-12 col-sm-6">
          <InfoBox label={data.job_type === "playlist" ? "Playlist" : "Album"} value={data.album_name || data.current_album || "\u2014"} />
        </div>
        <div className="col-12 col-sm-6">
          <InfoBox label="Songs" value={`${data.songs_downloaded} / ${data.total_songs}`} />
        </div>
        <div className="col-12 col-sm-6">
          <InfoBox label="Progress" value={data.total_songs > 0 ? `${pct}%` : "\u2014"} />
        </div>
      </div>

      {data.total_songs > 0 && !isSuccess && (
        <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#1e293b', border: '1px solid #334155', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>Progress</span>
            <span style={{ color: '#ffffff', fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{pct}%</span>
            <div style={{ flex: '1', height: '0.625rem', backgroundColor: '#0f172a', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: isFailed ? '#ef4444' : isSuccess ? '#22c55e' : COLORS.blue,
                  borderRadius: '999px',
                  transition: 'width 500ms ease',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {data.error && (
        <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#1e293b', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.8125rem' }}>
          <span style={{ fontWeight: 600 }}>Error: </span>{data.error}
        </div>
      )}

      {failedCount > 0 && !isRunning && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <button
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              border: `2px solid #f59e0b`,
              backgroundColor: retryMutation.isPending ? '#1e293b' : 'transparent',
              color: '#f59e0b',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: retryMutation.isPending ? 'not-allowed' : 'pointer',
              opacity: retryMutation.isPending ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 150ms ease',
            }}
          >
            {retryMutation.isPending ? (
              <><i className="pi pi-spin pi-spinner" style={{ fontSize: '0.75rem' }}></i>Retrying…</>
            ) : (
              <><i className="pi pi-refresh" style={{ fontSize: '0.75rem' }}></i>Retry {failedCount} failed song{failedCount > 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      )}

      <div style={{ borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #334155', marginBottom: '1rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
                {["#", "Title", "Artist", "Status", "Error"].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.songs.map((song, i) => (
                <tr
                  key={song.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? '#1e293b' : '#162135',
                    borderBottom: '1px solid #1e293b',
                    transition: 'background-color 150ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3a5f'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#1e293b' : '#162135'; }}
                >
                  <td style={{ padding: '0.75rem 1rem', color: '#475569', whiteSpace: 'nowrap' }}>{song.track_number ?? "\u2014"}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ color: '#ffffff', fontWeight: 500 }}>{song.title}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', display: 'none' }} className="d-md-none">{song.artist}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', display: 'none' }} className="d-md-table-cell">{song.artist}</td>
                  <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                    <StatusBadge status={song.status} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.75rem', display: 'none' }} className="d-lg-table-cell">{song.error || "\u2014"}</td>
                </tr>
              ))}
              {data.songs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No songs yet. The job is still initializing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', color: '#475569', fontSize: '0.75rem' }}>
        {data.created_at && <span>Created: {new Date((data.created_at.endsWith("Z") || data.created_at.includes("+") ? data.created_at : data.created_at + "Z")).toLocaleString()}</span>}
        {data.updated_at && <span>Updated: {new Date((data.updated_at.endsWith("Z") || data.updated_at.includes("+") ? data.updated_at : data.updated_at + "Z")).toLocaleString()}</span>}
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
    }}>
      <div style={{ color: '#64748b', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ color: '#ffffff', fontSize: '0.9375rem', fontWeight: 600, textTransform: 'capitalize' }}>{value}</div>
    </div>
  );
}

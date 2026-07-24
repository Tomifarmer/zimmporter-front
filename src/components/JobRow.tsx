"use client";

import { JobStatusResponse } from "@/types/api";
import StatusBadge from "@/components/StatusBadge";
import { COLORS } from "@/config/colors";

function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "\u2014";
  const now = Date.now();
  const then = new Date(dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z").getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function JobRow({ job }: { job: JobStatusResponse }) {
  const pct = job.total_songs > 0 ? Math.round((job.songs_downloaded / job.total_songs) * 100) : 0;
  const isRunning = job.status === "running" || job.status === "pending";
  const isFailed = job.status === "failed";
  const isSuccess = job.status === "success";
  const displayStatus = isSuccess && job.songs?.some((s) => s.status === "failed") ? "partial" : job.status;

  return (
    <a
      href={`/jobs/${job.job_id}`}
      className="text-decoration-none"
      style={{ display: 'block' }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '0.5rem',
          border: `1px solid ${isFailed ? '#ef4444' : isRunning ? COLORS.turquoise : '#334155'}`,
          padding: '1rem',
          transition: 'border-color 200ms ease, box-shadow 200ms ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = COLORS.blue;
          e.currentTarget.style.boxShadow = `0 0 8px ${COLORS.blue}33`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = isFailed ? '#ef4444' : isRunning ? COLORS.turquoise : '#334155';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div
              style={{
                width: '0.625rem',
                height: '0.625rem',
                borderRadius: '50%',
                backgroundColor: isRunning ? COLORS.turquoise : isSuccess ? '#22c55e' : isFailed ? '#ef4444' : '#475569',
                flexShrink: 0,
              }}
            />
            <span className="font-bold" style={{ color: '#ffffff', fontSize: '0.9375rem' }}>
              Job #{job.job_id}
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '0.125rem 0.5rem',
                borderRadius: '0.25rem',
                backgroundColor: job.job_type === 'album' ? `${COLORS.blue}22` : `${COLORS.turquoise}22`,
                color: job.job_type === 'album' ? COLORS.blue : COLORS.turquoise,
              }}
            >
              {job.job_type}
            </span>
            {job.artist && (
              <span style={{ color: '#94a3b8', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.artist}
              </span>
            )}
            {job.album_name && (
              <span style={{ color: COLORS.turquoise, fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {job.album_name}
              </span>
            )}
          </div>
          <StatusBadge status={displayStatus} />
        </div>

        {job.total_songs > 0 && (
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ flex: '1', height: '0.5rem', backgroundColor: '#0f172a', borderRadius: '999px', overflow: 'hidden' }}>
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
              <span className="text-xs text-gray-400" style={{ whiteSpace: 'nowrap' }}>
                {job.songs_downloaded}/{job.total_songs}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {job.created_at && (
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                Created {relativeTime(job.created_at)}
              </span>
            )}
            {job.updated_at && job.created_at !== job.updated_at && (
              <span style={{ color: '#475569', fontSize: '0.75rem' }}>
                Updated {relativeTime(job.updated_at)}
              </span>
            )}
          </div>
          {isRunning && (
            <span style={{ color: COLORS.turquoise, fontSize: '0.6875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span className="animate-pulse-fill" style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: COLORS.turquoise, display: 'inline-block' }} />
              Running
            </span>
          )}
        </div>

        {isFailed && job.error && (
          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #334155' }}>
            <span style={{ color: '#fca5a5', fontSize: '0.75rem' }}>{job.error}</span>
          </div>
        )}
      </div>
    </a>
  );
}

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

  const cardBorderColor = isFailed ? '#ef4444' : isRunning ? COLORS.turquoise : '#334155';
  const dotColor = isRunning ? COLORS.turquoise : isSuccess ? '#22c55e' : isFailed ? '#ef4444' : '#475569';
  const badgeBg = job.job_type === 'album' ? `${COLORS.blue}22` : `${COLORS.turquoise}22`;
  const badgeColor = job.job_type === 'album' ? COLORS.blue : COLORS.turquoise;
  const progressColor = isFailed ? '#ef4444' : isSuccess ? '#22c55e' : COLORS.blue;

  return (
    <a href={`/jobs/${job.job_id}`} className="job-row-wrapper text-decoration-none">
      <div
        className="job-row-card"
        style={{ '--card-border': cardBorderColor } as React.CSSProperties}
      >
        <div className="job-row-top-row">
          <div className="job-row-info-row">
            <div
              className="job-row-dot"
              style={{ '--dot-color': dotColor } as React.CSSProperties}
            />
            <span className="job-row-id font-bold">
              Job #{job.job_id}
            </span>
            <span
              className="job-row-type-badge"
              style={{ '--badge-bg': badgeBg, '--badge-color': badgeColor } as React.CSSProperties}
            >
              {job.job_type}
            </span>
            {job.artist && (
              <span className="job-row-artist">{job.artist}</span>
            )}
            {job.album_name && (
              <span className="job-row-album">{job.album_name}</span>
            )}
          </div>
          <StatusBadge status={displayStatus} />
        </div>

        {job.total_songs > 0 && (
          <div className="job-row-progress-section">
            <div className="job-row-progress-row">
              <div className="job-row-progress-track">
                <div
                  className="job-row-progress-fill"
                  style={{ '--pct': `${pct}%`, '--progress-color': progressColor } as React.CSSProperties}
                />
              </div>
              <span className="job-row-fraction text-xs text-gray-400">
                {job.songs_downloaded}/{job.total_songs}
              </span>
            </div>
          </div>
        )}

        <div className="job-row-meta-row">
          <div className="job-row-meta-left">
            {job.created_at && (
              <span className="job-row-meta-created">
                Created {relativeTime(job.created_at)}
              </span>
            )}
            {job.updated_at && job.created_at !== job.updated_at && (
              <span className="job-row-meta-updated">
                Updated {relativeTime(job.updated_at)}
              </span>
            )}
          </div>
          {isRunning && (
            <span className="job-row-running-indicator">
              <span className="job-row-running-dot animate-pulse-fill" />
              Running
            </span>
          )}
        </div>

        {isFailed && job.error && (
          <div className="job-row-error-section">
            <span className="job-row-error-text">{job.error}</span>
          </div>
        )}
      </div>
    </a>
  );
}

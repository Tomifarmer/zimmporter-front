"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { COLORS } from "@/config/colors";
import { useJobPolling } from "@/hooks/useJobPolling";
import { api } from "@/lib/api";

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
    return (
      <div className="jobs-loading-wrapper">
        <i className="pi pi-spin pi-spinner jobs-loading-icon" />
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="jobs-loading-wrapper">
        <i className="pi pi-spin pi-spinner jobs-loading-icon" />
      </div>
    );
  if (isError) return <div className="jobs-error-box">{error.message}</div>;
  if (!data) return <div className="jd-empty-state">Job not found.</div>;

  const pct =
    data.total_songs > 0 ? Math.round((data.songs_downloaded / data.total_songs) * 100) : 0;
  const isRunning = data.status === "running" || data.status === "pending";
  const isSuccess = data.status === "success";
  const isFailed = data.status === "failed";
  const failedCount = data.songs.filter((s) => s.status === "failed").length;
  const isPartial = isSuccess && failedCount > 0;
  const displayStatus = isPartial ? "partial" : data.status;

  const progressColor = isFailed
    ? "#ef4444"
    : isPartial
      ? "#f59e0b"
      : isSuccess
        ? "#22c55e"
        : COLORS.blue;

  return (
    <div className="space-y-6">
      <div className="jd-back-row">
        <a href="/jobs" className="jd-back-link">
          <i className="pi pi-arrow-left jd-back-icon" />
          Jobs
        </a>
      </div>

      <div className="jd-title-row">
        <h1 className="jd-title">Job #{data.job_id}</h1>
        <StatusBadge status={displayStatus} />
        {isRunning && (
          <span className="jd-polling-indicator">
            <span className="jd-polling-dot animate-pulse-fill" />
            Polling for updates
          </span>
        )}
      </div>

      <div className="row g-3 jd-info-cards-row">
        <div className="col-12 col-sm-6">
          <InfoBox label="Type" value={data.job_type} />
        </div>
        <div className="col-12 col-sm-6">
          <InfoBox
            label={data.job_type === "playlist" ? "Playlist" : "Album"}
            value={data.album_name || data.current_album || "\u2014"}
          />
        </div>
        <div className="col-12 col-sm-6">
          <InfoBox label="Songs" value={`${data.songs_downloaded} / ${data.total_songs}`} />
        </div>
        <div className="col-12 col-sm-6">
          <InfoBox label="Progress" value={data.total_songs > 0 ? `${pct}%` : "\u2014"} />
        </div>
        <div className="col-12 col-sm-6">
          <InfoBox label="Requested by" value={data.requested_by || "\u2014"} />
        </div>
      </div>

      {data.total_songs > 0 && (!isSuccess || isPartial) && (
        <div className="jd-progress-section">
          <div className="jd-progress-row">
            <span className="jd-progress-label">Progress</span>
            <span className="jd-progress-pct">{pct}%</span>
            <div className="jd-progress-track">
              <div
                className="jd-progress-fill"
                style={
                  { "--pct": `${pct}%`, "--progress-color": progressColor } as React.CSSProperties
                }
              />
            </div>
          </div>
        </div>
      )}

      {isFailed && data.error && (
        <div className="jd-error-box">
          <span className="jd-error-label">Error: </span>
          {data.error}
        </div>
      )}

      {failedCount > 0 && !isRunning && (
        <div className="jd-retry-wrapper">
          <button
            type="button"
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
            className="jd-retry-btn"
            style={
              {
                "--retry-bg": retryMutation.isPending ? "#1e293b" : "transparent",
                "--retry-cursor": retryMutation.isPending ? "not-allowed" : "pointer",
                "--retry-opacity": retryMutation.isPending ? 0.5 : 1,
              } as React.CSSProperties
            }
          >
            {retryMutation.isPending ? (
              <>
                <i className="pi pi-spin pi-spinner jd-retry-spinner" />
                Retrying…
              </>
            ) : (
              <>
                <i className="pi pi-refresh jd-refresh-icon" />
                Retry {failedCount} failed song{failedCount > 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      )}

      <div className="jd-table-wrapper">
        <div className="jd-table-scroll">
          <table className="jd-table">
            <thead>
              <tr className="jd-table-header">
                {["#", "Title", "Artist", "Status", "Error"].map((h) => (
                  <th key={h} className="jd-table-th">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.songs.map((song) => (
                <tr key={song.id} className="jd-table-row">
                  <td className="jd-table-td jd-table-td--track">
                    {song.track_number ?? "\u2014"}
                  </td>
                  <td className="jd-table-td">
                    <div className="jd-table-td--title">{song.title}</div>
                    <div className="jd-table-td--artist-mobile d-md-none">{song.artist}</div>
                  </td>
                  <td className="jd-table-td--artist-desktop d-md-table-cell">{song.artist}</td>
                  <td className="jd-table-td--status">
                    <StatusBadge status={song.status} />
                  </td>
                  <td className="jd-table-td--error d-lg-table-cell">
                    {song.status === "failed" ? song.error || "\u2014" : "\u2014"}
                  </td>
                </tr>
              ))}
              {data.songs.length === 0 && (
                <tr>
                  <td colSpan={5} className="jd-table-empty">
                    No songs yet. The job is still initializing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="jd-timestamps-row">
        {data.created_at && (
          <span>
            Created:{" "}
            {new Date(
              data.created_at.endsWith("Z") || data.created_at.includes("+")
                ? data.created_at
                : `${data.created_at}Z`,
            ).toLocaleString()}
          </span>
        )}
        {data.updated_at && (
          <span>
            Updated:{" "}
            {new Date(
              data.updated_at.endsWith("Z") || data.updated_at.includes("+")
                ? data.updated_at
                : `${data.updated_at}Z`,
            ).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="info-box">
      <div className="info-box-label">{label}</div>
      <div className="info-box-value">{value}</div>
    </div>
  );
}

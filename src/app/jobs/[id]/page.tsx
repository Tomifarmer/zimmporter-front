"use client";

import { useState, useEffect } from "react";
import { useJobPolling } from "@/hooks/useJobPolling";
import StatusBadge from "@/components/StatusBadge";

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

  if (!resolved) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (isLoading) return <div className="text-gray-500">Loading job...</div>;
  if (isError) return <div className="text-red-400">{error.message}</div>;
  if (!data) return <div className="text-gray-500">Job not found.</div>;

  const pct = data.total_songs > 0 ? Math.round((data.current_song / data.total_songs) * 100) : 0;
  const isRunning = data.status === "running" || data.status === "pending";

  return (
    <div className="space-y-6">
      <div className="d-flex align-items-center gap-3">
        <h1 className="text-2xl font-bold text-turquoise">Job #{data.job_id}</h1>
        <StatusBadge status={data.status} />
        {isRunning && (
          <span className="flex-shrink-0 animate-pulse-fill px-3 py-1 rounded-full text-sm text-gray-400">Polling for updates...</span>
        )}
      </div>

      {/* Info boxes grid */}
      <div className="d-grid gap-2 col-md-2 mx-auto">
        <InfoBox label="Type" value={data.job_type} />
        <InfoBox label="Album" value={data.album_name || data.current_album || "\u2014"} />
        <InfoBox label="Songs Downloaded" value={`${data.songs_downloaded} / ${data.total_songs}`} />
        <InfoBox label="Progress" value={data.total_albums > 1 ? `${data.album_progress} / ${data.total_albums}` : "\u2014"} />
      </div>

      {/* Progress bar */}
      {data.total_songs > 0 && (
        <div className="bg-light-blue rounded p-3 border border-blue d-flex align-items-center gap-3">
          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Progress</span>
          <span>{pct}%</span>
          <div style={{ flex: '1', height: '2rem', backgroundColor: '#0f172a', borderRadius: '999px', overflow: 'hidden' }}>
            <div className="progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: data.status === "failed" ? "#ef4444" : (data.status === "success" ? "#22c55e" : undefined) }} />
          </div>
        </div>
      )}

      {/* Message */}
      {data.message && (
        <div className="bg-light-blue rounded p-3 border border-blue text-white">{data.message}</div>
      )}
      {data.error && (
        <div className="text-red-400 bg-red-900/20 rounded p-3 border border-red-700">Error: {data.error}</div>
      )}

      {/* Songs table */}
      <div className="bg-light-blue rounded overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-blue text-gray-400 font-semibold px-3 py-2">
              <th>#</th>
              <th>Title</th>
              <th className="hidden md:table-cell">Artist</th>
              <th>Status</th>
              <th className="hidden lg:table-cell">Error</th>
            </tr>
          </thead>
          <tbody>
            {data.songs.map((song) => (
              <tr key={song.id} style={{ transition: 'background-color 0.15s ease' }}>
                <td className="text-gray-500 px-3 py-2">{song.track_number ?? "\u2014"}</td>
                <td className="px-3 py-2">
                  <div className="font-medium text-white">{song.title}</div>
                  <div className="hidden md:table-cell text-sm text-gray-500">{song.artist}</div>
                </td>
                <td className="text-gray-400 hidden md:table-cell px-3 py-2">{song.artist}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={song.status} />
                  {song.minio_path && (
                    <div className="hidden lg:table-cell text-sm text-gray-500 truncate" style={{ marginTop: '0.25rem' }}>{song.minio_path}</div>
                  )}
                </td>
                <td className="text-red-400 text-xs hidden lg:table-cell px-3 py-2">{song.error || "\u2014"}</td>
              </tr>
            ))}
            {data.songs.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No songs yet. The job is still initializing.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-600">
        Created: {new Date(data.created_at).toLocaleString()}  {" \u2022 "} Updated: {new Date(data.updated_at).toLocaleString()}
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-light-blue rounded p-3 border border-blue d-flex align-items-center justify-content-between gap-2">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-medium text-white capitalize mt-1">{value}</span>
    </div>
  );
}

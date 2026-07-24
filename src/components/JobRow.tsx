"use client";

import { useState } from "react";
import { JobStatusResponse } from "@/types/api";
import StatusBadge from "@/components/StatusBadge";

export default function JobRow({ job }: { job: JobStatusResponse }) {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded((prev) => !prev);
  };
  const pct = job.total_songs > 0 ? Math.round((job.current_song / job.total_songs) * 100) : 0;
  const isRunning = job.status === "running" || job.status === "pending";

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0' }}>
      <div className="cursor-pointer flex-shrink-0 text-sm text-gray-500 transition-colors hover:text-white" onClick={handleToggle}>
        {expanded ? "\u25BC" : "\u25B6"}
      </div>
      <span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '999px', backgroundColor: isRunning ? '#40e0d0' : '#475569' }} />
      <div style={{ flex: '1' }}>
        <a href={`/jobs/${job.job_id}`} className="text-white hover:text-gray-300 cursor-pointer block" onClick={(e) => e.stopPropagation()}>
          Job #{job.job_id}
        </a>
        <span className="text-sm text-gray-500 ml-4 capitalize">{job.job_type}</span>
        {job.album_name && (
          <span className="text-sm text-turquoise font-medium ml-2">{job.album_name}</span>
        )}
      </div>
      {job.total_songs > 0 && (
        <>
          <div className="hidden md:block w-40">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ flex: '1', height: '2rem', backgroundColor: '#0f172a', borderRadius: '999px', overflow: 'hidden' }}>
                <div className="progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: job.status === "failed" ? "#ef4444" : (job.status === "success" ? "#22c55e" : undefined) }} />
              </div>
              <span className="text-xs text-gray-400 w-16 text-right">
                {job.songs_downloaded}/{job.total_songs}
              </span>
            </div>
          </div>
        </>
      )}
      <StatusBadge status={job.status} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { JobStatusResponse } from "@/types/api";
import { api } from "@/lib/api";
import { Button } from "primereact/button";
import JobRow from "@/components/JobRow";

export default function JobsPage() {
  const [page, setPage] = useState(0);
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

  return (
    <div className="space-y-6">
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>Jobs</h1>

      {jobsQuery.isLoading && <div className="text-gray-500">Loading jobs...</div>}
      {jobsQuery.isError && (
        <div className="text-red-400">{jobsQuery.error.message}</div>
      )}
      {jobs.length === 0 && !jobsQuery.isLoading && (
        <div className="text-gray-500">No jobs found.</div>
      )}

      <div style={{ display: 'block' }}>
        {jobs.map((job) => (
          <JobRow key={job.job_id} job={job} />
        ))}
      </div>

      {jobs.length > 0 && (
        <div className="d-flex align-items-center justify-content-center gap-3 my-4">
          <Button label="Previous" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} />
          <span className="text-gray-400 py-2">Page {page + 1}</span>
          <Button label="Next" disabled={jobs.length < limit} onClick={() => setPage((p) => p + 1)} />
        </div>
      )}
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { JobStatusResponse } from "@/types/api";

export function useJobPolling(jobId: number | undefined) {
  const isRunning = (status: string) => status === "pending" || status === "running";

  return useQuery<JobStatusResponse>({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data } = await api.get<JobStatusResponse>(`/jobs/${jobId}`);
      return data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && isRunning(data.status) ? 3000 : false;
    },
    retry: 2,
  });
}

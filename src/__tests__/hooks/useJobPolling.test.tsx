import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { clearApiMocks, mockApi, mockApiGet } from "@/__tests__/helpers/api-mock";
import { buildJob } from "@/__tests__/helpers/factories";
import { useJobPolling } from "@/hooks/useJobPolling";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useJobPolling", () => {
  beforeEach(() => {
    clearApiMocks();
  });

  it("fetches job data for a given jobId", async () => {
    const job = buildJob({ job_id: 5 });
    mockApiGet(job);

    const { result } = renderHook(() => useJobPolling(5), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.job_id).toBe(5);
  });

  it("does not fetch when jobId is undefined", () => {
    renderHook(() => useJobPolling(undefined), { wrapper: createWrapper() });

    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("does not fetch when jobId is 0 or falsy", () => {
    renderHook(() => useJobPolling(0), { wrapper: createWrapper() });

    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("returns error state on API failure", async () => {
    mockApi.get.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useJobPolling(1), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 10000 });
    expect(result.current.error?.message).toBe("Network error");
  });

  it("polls every 3s while job is running", async () => {
    const job = buildJob({ job_id: 3, status: "running" });
    mockApiGet(job);

    const { result } = renderHook(() => useJobPolling(3), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.job_id).toBe(3);
    expect(result.current.data?.status).toBe("running");
  });
});

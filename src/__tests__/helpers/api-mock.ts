import { vi } from "vitest";

export const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
};

export function mockApiGet<T>(data: T) {
  mockApi.get.mockResolvedValue({ data });
}

export function mockApiPost<T>(data: T) {
  mockApi.post.mockResolvedValue({ data });
}

export function clearApiMocks() {
  mockApi.get.mockReset();
  mockApi.post.mockReset();
}

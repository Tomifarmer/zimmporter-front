import { vi } from "vitest";

export const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
};

export function mockApiGet<T>(data: T) {
  mockApi.get.mockResolvedValue({ data });
}

const getRoutes = new Map<string, unknown>();

export function mockApiGetUrl<T>(url: string, data: T) {
  getRoutes.set(url, data);
  mockApi.get.mockImplementation((u: string) => {
    if (getRoutes.has(u)) return Promise.resolve({ data: getRoutes.get(u) });
    return Promise.reject(new Error(`No mock for ${u}`));
  });
}

export function mockApiPost<T>(data: T) {
  mockApi.post.mockResolvedValue({ data });
}

export function clearApiMocks() {
  mockApi.get.mockReset();
  mockApi.post.mockReset();
  getRoutes.clear();
}

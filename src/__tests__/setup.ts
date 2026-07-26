import "@testing-library/jest-dom/vitest";
import { mockApi } from "./helpers/api-mock";

const mockSetAccessToken = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    get: mockApi.get,
    post: mockApi.post,
    defaults: {
      headers: { common: {} },
    },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
    },
  },
  setAccessToken: mockSetAccessToken,
  default: null,
}));

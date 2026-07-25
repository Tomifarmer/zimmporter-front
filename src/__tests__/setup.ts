import "@testing-library/jest-dom/vitest";
import { mockApi } from "./helpers/api-mock";

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
  default: null,
}));

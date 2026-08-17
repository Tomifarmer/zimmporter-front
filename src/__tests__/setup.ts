import "@testing-library/jest-dom/vitest";
import { mockApi } from "./helpers/api-mock";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

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
  hasApiKeyError: vi.fn(),
  onApiKeyError: vi.fn(),
  clearApiKeyError: vi.fn(),
  hasSocialLoginError: vi.fn(),
  onSocialLoginError: vi.fn(),
  clearSocialLoginError: vi.fn(),
  hasAuthTokenInvalid: vi.fn(),
  onAuthTokenInvalid: vi.fn(),
  clearAuthTokenInvalid: vi.fn(),
  default: null,
}));

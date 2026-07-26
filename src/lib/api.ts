import axios from "axios";
import { getRuntimeConfig } from "./config";

const cfg = getRuntimeConfig();

export const api = axios.create({
  baseURL: cfg.apiUrl,
  timeout: 30000,
});

let _accessToken: string | undefined;

export function setAccessToken(token: string | undefined) {
  _accessToken = token;
}

let _apiKeyError = false;
let _onApiKeyError: (() => void) | null = null;

export function hasApiKeyError() {
  return _apiKeyError;
}

export function onApiKeyError(cb: () => void) {
  _onApiKeyError = cb;
  if (_apiKeyError) cb();
}

export function clearApiKeyError() {
  _apiKeyError = false;
}

let _socialLoginError = false;
let _onSocialLoginError: (() => void) | null = null;

export function hasSocialLoginError() {
  return _socialLoginError;
}

export function onSocialLoginError(cb: () => void) {
  _onSocialLoginError = cb;
  if (_socialLoginError) cb();
}

export function clearSocialLoginError() {
  _socialLoginError = false;
}

api.interceptors.request.use((config) => {
  const { apiKey, useSimpleAuth } = getRuntimeConfig();
  if (useSimpleAuth && apiKey) {
    config.headers["X-API-Key"] = apiKey;
  }
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const detail = error.response?.data?.detail || "";
      const msg = typeof detail === "string" ? detail : JSON.stringify(detail);
      if (msg.includes("API key")) {
        const { useSimpleAuth, apiKey } = getRuntimeConfig();
        if (!useSimpleAuth || !apiKey) {
          _apiKeyError = true;
          _onApiKeyError?.();
          return Promise.reject(
            new Error(
              useSimpleAuth
                ? "API key required. Set API_KEY in your environment."
                : "API key required. Enable USE_SIMPLE_AUTH and configure API_KEY.",
            ),
          );
        }
      }
      if (
        msg.includes("authentication token") &&
        !_accessToken &&
        !getRuntimeConfig().useSocialLogin
      ) {
        _socialLoginError = true;
        _onSocialLoginError?.();
        return Promise.reject(new Error("Authentication required. Please sign in."));
      }
    }
    const message = error.response?.data?.detail || error.message || "Request failed";
    return Promise.reject(
      new Error(typeof message === "string" ? message : JSON.stringify(message)),
    );
  },
);

export default api;

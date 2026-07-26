import axios from "axios";
import { getRuntimeConfig } from "./config";

const cfg = getRuntimeConfig();

export const api = axios.create({
  baseURL: cfg.apiUrl,
  timeout: 30000,
});

if (cfg.apiKey) {
  api.defaults.headers.common["X-API-Key"] = cfg.apiKey;
}

let _accessToken: string | undefined;

export function setAccessToken(token: string | undefined) {
  _accessToken = token;
}

api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || "Request failed";
    return Promise.reject(
      new Error(typeof message === "string" ? message : JSON.stringify(message)),
    );
  },
);

export default api;

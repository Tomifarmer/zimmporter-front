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

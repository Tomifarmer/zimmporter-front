import axios from "axios";

type Config = { apiUrl: string; apiKey: string };

let configPromise: Promise<Config> | null = null;

function getConfig(): Promise<Config> {
  if (!configPromise) {
    configPromise = fetch("/api/config")
      .then((res) => res.json())
      .then((cfg) => ({
        apiUrl: cfg.apiUrl || "http://localhost:8000",
        apiKey: cfg.apiKey || "",
      }))
      .catch(() => ({
        apiUrl: "http://localhost:8000",
        apiKey: "",
      }));
  }
  return configPromise;
}

export const api = axios.create({
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const cfg = await getConfig();
  config.baseURL = cfg.apiUrl;
  if (cfg.apiKey) {
    config.headers["X-API-Key"] = cfg.apiKey;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail || error.message || "Request failed";
    return Promise.reject(new Error(typeof message === "string" ? message : JSON.stringify(message)));
  }
);

export default api;

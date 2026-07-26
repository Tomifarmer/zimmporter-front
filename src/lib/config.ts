export type RuntimeConfig = {
  apiUrl: string;
  apiKey: string;
};

export function getRuntimeConfig(): RuntimeConfig {
  if (typeof window === "undefined") {
    return { apiUrl: "http://localhost:8000", apiKey: "" };
  }
  return (
    (window as { __RUNTIME_CONFIG__?: RuntimeConfig }).__RUNTIME_CONFIG__ ?? {
      apiUrl: "http://localhost:8000",
      apiKey: "",
    }
  );
}

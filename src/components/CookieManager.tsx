"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import type { CookieStatus } from "@/types/api";

import "./CookieManager.css";

export default function CookieManager() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<CookieStatus>({
    queryKey: ["cookies"],
    queryFn: async () => {
      const { data } = await api.get<CookieStatus>("/cookies");
      return data;
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<CookieStatus>("/cookies", formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cookies"] });
      setSelectedFile(null);
      setError(null);
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSelectedFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    upload.mutate(selectedFile);
  };

  const youtubeDomains = (data?.domains ?? []).filter((d) => d.includes("youtube"));
  const formattedDate = data?.modified_at ? new Date(data.modified_at).toLocaleString() : null;

  return (
    <div className="cookie-manager">
      <div className="cookie-manager-title-row">
        <span className="cookie-manager-title">YouTube cookies</span>
        {!isLoading && data && (
          <span className={`cookie-status-badge${data.exists ? " cookie-status-badge--ok" : ""}`}>
            {data.exists ? "Configured" : "Not configured"}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="cookie-manager-loading">
          <i className="pi pi-spin pi-spinner" />
        </div>
      )}

      {isError && !data && <div className="text-red-400">Failed to load cookie status.</div>}

      {!isLoading && data && (
        <div className="cookie-manager-status">
          {data.exists ? (
            <ul className="cookie-manager-facts">
              <li>
                <span className="cookie-manager-fact-label">Cookies</span>
                <span className="cookie-manager-fact-value">{data.cookie_count}</span>
              </li>
              <li>
                <span className="cookie-manager-fact-label">YouTube domains</span>
                <span className="cookie-manager-fact-value">
                  {youtubeDomains.length > 0 ? youtubeDomains.join(", ") : "none"}
                </span>
              </li>
              <li>
                <span className="cookie-manager-fact-label">Last updated</span>
                <span className="cookie-manager-fact-value">{formattedDate ?? "unknown"}</span>
              </li>
            </ul>
          ) : (
            <p className="cookie-manager-empty">
              No cookies configured. Export your YouTube cookies in Netscape format (e.g. with a
              browser extension) and upload them here to authenticate age-restricted downloads.
            </p>
          )}
        </div>
      )}

      <div className="cookie-manager-upload">
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.cookies,.tidycookies"
          aria-label="Cookies file"
          className="cookie-manager-file"
          onChange={handleFileChange}
        />
        <div className="cookie-manager-upload-row">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="cookie-manager-pick-btn"
          >
            <i className="pi pi-folder-open cookie-manager-pick-icon" />
            Choose cookies file
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || upload.isPending}
            className="cookie-manager-upload-btn"
          >
            {upload.isPending ? (
              <>
                <i className="pi pi-spin pi-spinner cookie-manager-btn-icon" />
                Uploading…
              </>
            ) : (
              "Upload cookies"
            )}
          </button>
        </div>
        {selectedFile && !upload.isPending && (
          <span className="cookie-manager-file-name">{selectedFile.name}</span>
        )}
      </div>

      {error && <div className="cookie-manager-error">{error}</div>}
    </div>
  );
}

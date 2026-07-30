"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Badge } from "primereact/badge";
import { Card } from "primereact/card";
import type { DropdownChangeEvent } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { SearchResponse, SearchResult } from "@/types/api";

const Dropdown = dynamic(
  () => import("primereact/dropdown").then((mod) => mod.Dropdown || mod.default),
  { ssr: false },
);

type SearchType = "albums" | "featured_playlists" | "community_playlists";

const LIMIT_DEFAULT = 10;
const LIMIT_MAX = 50;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("albums");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(LIMIT_DEFAULT);
  const [concurrent, setConcurrent] = useState(4);
  const [showSettings, setShowSettings] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const searchResult = useQuery<SearchResponse>({
    queryKey: ["search", submittedQuery, searchType, limit],
    queryFn: async () => {
      const { data } = await api.get<SearchResponse>("/search", {
        params: { q: submittedQuery, type: searchType, limit },
      });
      return data;
    },
    enabled: submittedQuery.length > 0,
    placeholderData: keepPreviousData,
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const browseIds = Array.from(selected);
      const endpoint = searchType === "albums" ? "/download/album" : "/download/playlist";
      const requests = browseIds.map((id) =>
        api.post<{ job_id: number; status: string }>(endpoint, { id, concurrent }),
      );
      const results = await Promise.all(requests);
      return results.map((r) => r.data.job_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setSelected(new Set());
      window.location.href = `/jobs`;
    },
  });

  const handleDownload = useCallback(() => {
    downloadMutation.mutate();
  }, [downloadMutation]);

  const toggleSelect = (browseId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(browseId)) {
        next.delete(browseId);
      } else {
        next.add(browseId);
      }
      return next;
    });
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length > 1 && e.key !== "Backspace" && e.key !== "Enter") return;

      const input = inputRef.current;
      if (!input) return;

      e.preventDefault();
      input.focus();

      if (e.key === "Backspace") {
        setQuery((prev) => prev.slice(0, -1));
      } else if (e.key.length === 1) {
        setQuery((prev) => prev + e.key);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const { results } = searchResult.data || { results: [] };

  return (
    <div className="space-y-6">
      <div className="search-bar-row">
        <Badge
          value={searchType === "albums" ? "A" : searchType === "featured_playlists" ? "F" : "C"}
          title={
            searchType === "albums"
              ? "Album selected"
              : searchType === "featured_playlists"
                ? "Featured Playlists selected"
                : "Community Playlists selected"
          }
          className="search-type-badge"
        />
        <div className="search-input-wrapper">
          <InputText
            ref={inputRef}
            className="search-text-input"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Search for albums or playlists..."
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setSubmittedQuery(query);
                setLimit(LIMIT_DEFAULT);
              }
            }}
          />
          <Dropdown
            className="search-dropdown"
            value={searchType}
            options={[
              { label: "Albums", value: "albums" },
              { label: "Featured Playlists", value: "featured_playlists" },
              { label: "Community Playlists", value: "community_playlists" },
            ]}
            onChange={(e: DropdownChangeEvent) => setSearchType(e.value as SearchType)}
            dropdownIcon="pi pi-chevron-down"
          />
        </div>
      </div>

      {searchResult.isLoading && (
        <div className="search-loading-wrapper">
          <i className="pi pi-spin pi-spinner search-loading-icon" />
        </div>
      )}
      {searchResult.isError && <div className="text-red-400">{searchResult.error.message}</div>}
      {searchResult.isSuccess && results.length === 0 && (
        <div className="search-no-results">No results found.</div>
      )}

      <div className={`results-loading${searchResult.isFetching ? " is-fetching" : ""}`}>
        <div className="row g-3">
          {results.map((result, i) => (
            <div
              key={result.browseId || result.videoId}
              className="col-12 col-sm-6 col-md-4 col-lg-3 result-card-enter"
              style={{ animationDelay: `${(i % 4) * 50}ms` }}
            >
              <ResultCard
                result={result}
                checked={selected.has(result.browseId || "")}
                onChange={() => result.browseId && toggleSelect(result.browseId)}
              />
            </div>
          ))}
        </div>
      </div>

      {results.length > 0 && limit < LIMIT_MAX && results.length >= limit && (
        <div className="search-load-more-wrapper">
          <button
            type="button"
            onClick={() => setLimit((prev) => Math.min(prev * 2, LIMIT_MAX))}
            disabled={searchResult.isFetching}
            className="search-load-more-btn"
          >
            {searchResult.isFetching ? (
              <>
                <i className="pi pi-spin pi-spinner search-btn-icon" />
                Loading…
              </>
            ) : (
              <>
                <i className="pi pi-plus search-btn-plus" />
                Load More
              </>
            )}
          </button>
        </div>
      )}

      {results.length > 0 && (
        <>
          <button
            type="button"
            onClick={handleDownload}
            title="Start download"
            disabled={selected.size === 0 || downloadMutation.isPending}
            className="search-float-btn"
            style={
              {
                backgroundColor: selected.size > 0 ? "#3b82f6" : "#1e293b",
                cursor:
                  selected.size > 0 && !downloadMutation.isPending ? "pointer" : "not-allowed",
                opacity: selected.size === 0 || downloadMutation.isPending ? 0.5 : 1,
              } as React.CSSProperties
            }
          >
            <i className="pi pi-download search-float-btn-icon" />
            {selected.size > 0 && <span className="search-float-badge">{selected.size}</span>}
          </button>

          <button
            type="button"
            onClick={() => setShowSettings((prev) => !prev)}
            title="Concurrent downloads"
            className="search-settings-btn"
          >
            <i className="pi pi-cog search-settings-icon" />
          </button>

          {showSettings && (
            <div className="search-settings-panel">
              <div className="search-settings-content">
                <span className="search-settings-label">Concurrent downloads</span>
                <div className="search-settings-slider-row">
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={concurrent}
                    onChange={(e) => setConcurrent(Number(e.target.value))}
                  />
                  <span className="search-settings-value">{concurrent}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ResultCard({
  result,
  checked,
  onChange,
}: {
  result: SearchResult;
  checked: boolean;
  onChange: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const artist = useMemo(
    () => result.artist?.join(", ") || result.author || "Unknown",
    [result.artist, result.author],
  );

  useEffect(() => {
    if (!result.thumbnail) return;
    setImageLoaded(false);
    setImageFailed(false);
    setRetryCount(0);
  }, [result.thumbnail]);

  const handleLoad = () => setImageLoaded(true);
  const handleError = () => {
    if (retryCount >= 3) {
      setImageFailed(true);
    } else {
      setTimeout(() => setRetryCount((c) => c + 1), 3000);
    }
  };

  return (
    <div>
      <Card className={`result-card h-100${checked ? " card-glow" : ""}`}>
        <div className="result-card-img-wrapper">
          {result.thumbnail && imageLoaded ? (
            <img
              src={result.thumbnail}
              alt={result.title}
              referrerPolicy="no-referrer"
              className="result-card-img"
            />
          ) : result.thumbnail && !imageFailed ? (
            <div className="result-card-img-placeholder">
              <div className="result-card-img-loading">
                <i className="pi pi-spin pi-spinner result-card-spinner" />
              </div>
              <img
                key={retryCount}
                src={result.thumbnail}
                alt=""
                referrerPolicy="no-referrer"
                onLoad={handleLoad}
                onError={handleError}
                className="result-card-hidden-img"
              />
            </div>
          ) : (
            <div className="result-card-fallback">
              <i className="pi pi-music result-card-fallback-icon" />
            </div>
          )}
        </div>
        <div className="result-card-body">
          <div className="result-card-title" title={result.title}>
            {result.title}
          </div>
          <div className="result-card-artist" title={artist}>
            {artist}
          </div>
          <div className="result-card-meta">
            {[result.year, result.type, result.trackCount && `${result.trackCount} songs`]
              .filter(Boolean)
              .join(" • ") || "\u00a0"}
          </div>
        </div>
        <div className="result-card-footer">
          <label title="Add" className="result-card-checkbox-wrapper">
            <input
              type="checkbox"
              checked={checked}
              onChange={onChange}
              className="result-card-checkbox-input"
            />
            <span
              className={`result-card-checkbox-custom${checked ? " result-card-checkbox-custom--checked" : ""}`}
            >
              {checked && <span className="result-card-checkmark">{"\u2713"}</span>}
            </span>
          </label>
          {result.browseId && (
            <a
              href={`https://music.youtube.com/browse/${result.browseId}`}
              target="_blank"
              rel="noopener noreferrer"
              title="See on YouTube Music"
            >
              <i className="pi pi-youtube result-card-youtube" />
            </a>
          )}
        </div>
      </Card>
    </div>
  );
}

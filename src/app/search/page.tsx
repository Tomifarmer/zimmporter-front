"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { SearchResponse, SearchResult } from "@/types/api";
import { api } from "@/lib/api";
import { InputText } from "primereact/inputtext";
import { Badge } from "primereact/badge";
import { Card } from "primereact/card";
import type { DropdownChangeEvent } from "primereact/dropdown";

import { COLORS } from "@/config/colors";

const Dropdown = dynamic(
  () => import("primereact/dropdown").then((mod) => mod.Dropdown || mod.default),
  { ssr: false },
);

type SearchType = "albums" | "playlists";

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
        api.post<{ job_id: number; status: string }>(endpoint, { id, concurrent })
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

  const { results } = searchResult.data || { results: [] };

  return (
    <div className="space-y-6">
        <style>{`
          .search-input::placeholder { color: #ffffff; opacity: 0.7; }
          .search-dropdown { border: none !important; background: transparent !important; padding: 0 !important; margin: 0 !important; outline: none !important; box-shadow: none !important; }
          .search-dropdown .p-dropdown-label { display: none !important; }
          .search-dropdown .p-dropdown-trigger { width: 60px !important; height: 100% !important; background-color: #3b82f6 !important; border-radius: 0 !important; margin: 0 !important; padding: 0 !important; }
          .p-dropdown-panel { background-color: #3f4458 !important; border-radius: 0.4rem !important; }
          .p-dropdown-panel .p-dropdown-items { padding: 0 !important; margin: 0 !important; }
          .p-dropdown-panel .p-dropdown-item { color: #e2e8f0 !important; padding: 0.5rem 1rem !important; border: none !important; outline: none !important; }
          .p-dropdown-panel .p-dropdown-item.p-highlight { background-color: rgba(59, 130, 246, 0.2) !important; color: #60a5fa !important; font-weight: 600 !important; }
          .p-dropdown-panel .p-dropdown-item:hover { border: none !important; outline: none !important; text-decoration: underline !important; }
          .results-loading { transition: opacity 250ms ease; }
          .results-loading.is-fetching { opacity: 0.5; pointer-events: none; }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          .result-card-enter { animation: fadeInUp 300ms ease both; }
          @keyframes glow { from { box-shadow: 0 0 6px rgba(59, 130, 246, 0.4); } to { box-shadow: 0 0 14px rgba(59, 130, 246, 0.8); } }
          .card-glow { box-shadow: 0 0 10px rgba(59, 130, 246, 0.7); animation: glow 1.2s ease-in-out infinite alternate; }

        `}</style>
        <div style={{ display: 'flex', marginBottom: '1rem', alignItems: 'stretch', height: '3.5rem', position: 'relative' }}>
          <Badge value={searchType === "albums" ? "A" : "P"} title={searchType === "albums" ? "Album selected" : "Playlist selected"} style={{ position: 'absolute', top: '-0.625rem', left: '-0.625rem', fontSize: '0.75rem', minWidth: '1.375rem', height: '1.375rem', borderRadius: '999px', backgroundColor: '#40e0d0', color: '#1e293b', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
          <div style={{ display: 'flex', flex: 1, alignItems: 'stretch', backgroundColor: 'transparent', border: `2px solid ${COLORS.blue}`, borderRadius: '0.6rem', overflow: 'hidden' }}>
            <InputText
              className="search-input"
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
              style={{ flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', padding: '0 1rem', color: '#ffffff' }}
            />
            <Dropdown
              className="search-dropdown"
              value={searchType}
              options={[
                { label: "Albums", value: "albums" },
                { label: "Playlists", value: "playlists" },
              ]}
              onChange={(e: DropdownChangeEvent) => setSearchType(e.value as SearchType)}
              dropdownIcon="pi pi-chevron-down"
              style={{ border: 'none', outline: 'none' }}
            />
          </div>
        </div>

      {searchResult.isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#3b82f6', margin: "1rem 0" }}></i>
        </div>
      )}
      {searchResult.isError && (
        <div className="text-red-400">{searchResult.error.message}</div>
      )}
      {searchResult.isSuccess && results.length === 0 && (
        <div style={{ color: '#64748b', fontSize: '0.8125rem' }}>No results found.</div>
      )}

      <div className={`results-loading${searchResult.isFetching ? ' is-fetching' : ''}`}>
        <div className="row g-3">
          {results.map((result, i) => (
            <div key={result.browseId || result.videoId} className="col-12 col-sm-6 col-md-4 col-lg-3 result-card-enter" style={{ animationDelay: `${(i % 4) * 50}ms` }}>
              <ResultCard result={result} checked={selected.has(result.browseId || "")} onChange={() => result.browseId && toggleSelect(result.browseId)} />
            </div>
          ))}
        </div>
      </div>

      {results.length > 0 && limit < LIMIT_MAX && results.length >= limit && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem' }}>
          <button
            onClick={() => setLimit((prev) => Math.min(prev * 2, LIMIT_MAX))}
            disabled={searchResult.isFetching}
            style={{
              padding: '0.625rem 2rem',
              borderRadius: '0.5rem',
              border: `2px solid ${COLORS.blue}`,
              backgroundColor: 'transparent',
              color: '#ffffff',
              cursor: searchResult.isFetching ? 'not-allowed' : 'pointer',
              opacity: searchResult.isFetching ? 0.6 : 1,
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'background-color 150ms ease',
            }}
          >
            {searchResult.isFetching ? (
              <><i className="pi pi-spin pi-spinner" style={{ marginRight: '0.5rem' }}></i>Loading…</>
            ) : (
              <><i className="pi pi-plus" style={{ marginRight: '0.5rem', fontSize: '0.75rem' }}></i>Load More</>
            )}
          </button>
        </div>
      )}

      {results.length > 0 && (
        <>
          <button
            onClick={handleDownload}
            title="Start download"
            disabled={selected.size === 0 || downloadMutation.isPending}
            style={{
              position: 'fixed',
              left: 'calc((100vw + 1480px) / 2 + 0.75rem)',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1000,
              width: '3rem',
              height: '3rem',
              borderRadius: '0.5rem',
              border: `2px solid ${COLORS.blue}`,
              backgroundColor: selected.size > 0 ? '#3b82f6' : '#1e293b',
              color: '#fff',
              cursor: selected.size > 0 && !downloadMutation.isPending ? 'pointer' : 'not-allowed',
              opacity: selected.size === 0 || downloadMutation.isPending ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 150ms ease',
            }}
          >
            <i className="pi pi-download" style={{ fontSize: '1.25rem' }}></i>
            {selected.size > 0 && (
              <span style={{ position: 'absolute', top: '-0.375rem', right: '-0.375rem', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.625rem', fontWeight: 700, borderRadius: '50%', width: '1rem', height: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selected.size}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowSettings((prev) => !prev)}
            title="Concurrent downloads"
            style={{
              position: 'fixed',
              left: 'calc((100vw + 1480px) / 2 + 0.75rem)',
              top: 'calc(50% + 3.5rem)',
              zIndex: 1000,
              width: '3rem',
              height: '3rem',
              borderRadius: '0.5rem',
              border: `2px solid ${COLORS.blue}`,
              backgroundColor: '#1e293b',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="pi pi-cog" style={{ fontSize: '1.25rem' }}></i>
          </button>

          {showSettings && (
            <div style={{ position: 'fixed', left: 'calc((100vw + 1480px) / 2 - 14rem)', top: 'calc(50% + 3.5rem)', zIndex: 1000, backgroundColor: '#1e293b', border: `1px solid ${COLORS.blue}`, borderRadius: '0.625rem', padding: '1rem', minWidth: '14rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ color: '#e2e8f0', fontSize: '0.8125rem', fontWeight: 600 }}>Concurrent downloads</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input type="range" min={1} max={8} value={concurrent} onChange={(e) => setConcurrent(Number(e.target.value))} />
                  <span style={{ color: '#40e0d0', fontFamily: 'monospace', fontSize: '0.875rem' }}>{concurrent}</span>
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
  const artist = useMemo(() => result.artist?.join(", ") || result.author || "Unknown", [result.artist, result.author]);

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
      <Card
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          transition: 'box-shadow 200ms ease',
        }}
        className={`h-100${checked ? ' card-glow' : ''}`}
      >
        <div style={{ width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
          {result.thumbnail && imageLoaded ? (
            <img
              src={result.thumbnail}
              alt={result.title}
              referrerPolicy="no-referrer"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : result.thumbnail && !imageFailed ? (
            <div style={{ width: '100%', aspectRatio: '1/1' }}>
              <div style={{ width: '100%', height: '100%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#64748b' }}></i>
              </div>
              <img
                key={retryCount}
                src={result.thumbnail}
                alt=""
                referrerPolicy="no-referrer"
                onLoad={handleLoad}
                onError={handleError}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="pi pi-music" style={{ fontSize: '2rem', color: '#64748b' }}></i>
            </div>
          )}
        </div>
        <div style={{ padding: '0.75rem 1rem' }}>
          <div className="font-medium text-white" title={result.title} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.title}</div>
          <div className="text-sm text-gray-400" title={artist} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</div>
          <div className="text-xs text-gray-500 mt-1">
            {[result.year, result.type, result.trackCount && `${result.trackCount} songs`].filter(Boolean).join(' • ') || '\u00a0'}
          </div>
        </div>
        <div style={{ padding: '0 1rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label title="Add" style={{ cursor: 'pointer', position: 'relative', width: '1.25rem', height: '1.25rem' }}>
            <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }} />
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '1.25rem', height: '1.25rem', borderRadius: '0.375rem', border: `2px solid ${COLORS.blue}`, backgroundColor: checked ? '#3b82f6' : 'transparent', transition: 'background-color 150ms ease' }}>
              {checked && <span style={{ color: '#fff', fontSize: '0.75rem' }}>{'\u2713'}</span>}
            </span>
          </label>
          {result.browseId && (
            <a href={`https://music.youtube.com/browse/${result.browseId}`} target="_blank" rel="noopener noreferrer" title="See on YouTube Music">
              <i className="pi pi-youtube" style={{ fontSize: '1.25rem', color: '#ef4444' }}></i>
            </a>
          )}
        </div>
      </Card>
    </div>
  );
}

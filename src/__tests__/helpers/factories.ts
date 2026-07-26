import type { JobStatusResponse, SearchResponse, SearchResult, Song } from "@/types/api";

export function buildSearchResult(overrides?: Partial<SearchResult>): SearchResult {
  return {
    resultType: "album",
    browseId: "MPREb_12345",
    title: "Test Album",
    artist: ["Test Artist"],
    year: "2024",
    type: "Album",
    trackCount: 12,
    thumbnail: "https://example.com/thumb.jpg",
    ...overrides,
  };
}

export function buildSearchResponse(overrides?: Partial<SearchResponse>): SearchResponse {
  return {
    results: [buildSearchResult()],
    ...overrides,
  };
}

export function buildSong(overrides?: Partial<Song>): Song {
  return {
    id: 1,
    title: "Test Song",
    artist: "Test Artist",
    album: "Test Album",
    track_number: 1,
    status: "success",
    s3_path: "s3://bucket/test.mp3",
    error: null,
    ...overrides,
  };
}

export function buildJob(overrides?: Partial<JobStatusResponse>): JobStatusResponse {
  return {
    job_id: 1,
    job_type: "album",
    browse_id: "MPREb_12345",
    status: "running",
    message: "Downloading...",
    error: null,
    current_album: "Test Album",
    album_progress: 50,
    total_albums: 1,
    current_song: 5,
    total_songs: 12,
    artist: "Test Artist",
    album_name: "Test Album",
    songs_downloaded: 5,
    songs: [
      buildSong({ id: 1, status: "success" }),
      buildSong({ id: 2, status: "downloading" }),
      buildSong({ id: 3, status: "pending" }),
    ],
    created_at: new Date(Date.now() - 60_000).toISOString(),
    updated_at: new Date(Date.now() - 60_000).toISOString(),
    ...overrides,
  };
}

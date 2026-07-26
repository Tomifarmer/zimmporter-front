export interface SearchResult {
  resultType: string;
  browseId?: string;
  videoId?: string;
  title: string;
  year?: string;
  type?: string;
  artist?: string[];
  author?: string;
  duration?: string;
  thumbnail?: string;
  name?: string[];
  subscribers?: string;
  trackCount?: number;
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface DownloadRequest {
  id: string;
  concurrent?: number;
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  track_number: number | null;
  status: "pending" | "downloading" | "success" | "failed" | "unavailable";
  s3_path: string | null;
  error: string | null;
}

export interface JobStatusResponse {
  job_id: number;
  job_type: "album" | "playlist";
  browse_id: string;
  status: "pending" | "running" | "success" | "failed";
  message: string;
  error: string | null;
  current_album: string | null;
  album_progress: number;
  total_albums: number;
  current_song: number;
  total_songs: number;
  artist?: string;
  album_name?: string;
  requested_by?: string;
  songs_downloaded: number;
  songs: Song[];
  created_at: string;
  updated_at: string;
}

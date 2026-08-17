"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS } from "@/config/colors";
import { api } from "@/lib/api";
import type { StatsResponse } from "@/types/api";
import "./StatsPage.css";

const STATUS_COLORS: Record<string, string> = {
  pending: "#6b7280",
  running: "#40e0d0",
  success: "#22c55e",
  failed: "#ef4444",
  partial: "#f59e0b",
  unavailable: "#a855f7",
};

const TYPE_COLORS = {
  album: "#3b82f6",
  playlist: "#40e0d0",
};

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="stats-card" style={{ "--card-accent": accent } as React.CSSProperties}>
      <div className="stats-card-value">{value.toLocaleString()}</div>
      <div className="stats-card-label">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="stats-empty-state">
      <i className="pi pi-chart-bar stats-empty-icon" />
      <span className="stats-empty-text">No data yet. Start a download from the search page.</span>
    </div>
  );
}

export default function StatsPage() {
  const statsQuery = useQuery<StatsResponse>({
    queryKey: ["stats"],
    queryFn: async () => {
      const { data } = await api.get<StatsResponse>("/stats");
      return data;
    },
  });

  if (statsQuery.isLoading)
    return (
      <div className="stats-loading-wrapper">
        <i className="pi pi-spin pi-spinner stats-loading-icon" />
      </div>
    );
  if (statsQuery.isError) return <div className="stats-error-box">{statsQuery.error.message}</div>;
  if (!statsQuery.data) return null;

  const { jobs, library, genres, top_users = [] } = statsQuery.data;

  const hasData = jobs.total > 0 || library.albums > 0 || library.playlists > 0;
  if (!hasData) return <EmptyState />;

  const statusData = Object.entries(jobs.by_status)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({ name, value }));

  const typeData = (
    [
      { name: "album", value: jobs.by_type.album },
      { name: "playlist", value: jobs.by_type.playlist },
    ] as { name: keyof typeof TYPE_COLORS; value: number }[]
  ).filter((d) => d.value > 0);

  const genreData = genres.slice(0, 10);
  const maxGenreCount = Math.max(...genreData.map((g) => g.count), 1);

  return (
    <div className="space-y-6">
      <div className="stats-header-row">
        <h1 className="stats-title">Stats</h1>
      </div>

      <div className="stats-cards-row">
        <SummaryCard label="Total jobs" value={jobs.total} accent="#3b82f6" />
        <SummaryCard label="Albums in library" value={library.albums} accent="#3b82f6" />
        <SummaryCard label="Playlists in library" value={library.playlists} accent="#40e0d0" />
        <SummaryCard label="Artists" value={library.artists} accent="#f59e0b" />
        <SummaryCard label="Tracks" value={library.tracks} accent="#22c55e" />
      </div>

      <div className="stats-charts-row">
        <div className="stats-chart-card">
          <h2 className="stats-chart-title">Jobs by status</h2>
          {statusData.length > 0 ? (
            <div className="stats-chart-donut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#64748b"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "0.5rem",
                    }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="stats-chart-empty">No jobs yet.</div>
          )}
          <div className="stats-legend">
            {statusData.map((entry) => (
              <span key={entry.name} className="stats-legend-item">
                <span
                  className="stats-legend-dot"
                  style={{ backgroundColor: STATUS_COLORS[entry.name] ?? "#64748b" }}
                />
                {entry.name} ({entry.value})
              </span>
            ))}
          </div>
        </div>

        <div className="stats-chart-card">
          <h2 className="stats-chart-title">Jobs: album vs playlist</h2>
          {typeData.length > 0 ? (
            <div className="stats-chart-donut">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {typeData.map((entry) => (
                      <Cell key={entry.name} fill={TYPE_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "0.5rem",
                    }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="stats-chart-empty">No jobs yet.</div>
          )}
          <div className="stats-legend">
            {typeData.map((entry) => (
              <span key={entry.name} className="stats-legend-item">
                <span
                  className="stats-legend-dot"
                  style={{ backgroundColor: TYPE_COLORS[entry.name] }}
                />
                {entry.name} ({entry.value})
              </span>
            ))}
          </div>
        </div>

        <div className="stats-chart-card">
          <h2 className="stats-chart-title">Top users</h2>
          {top_users.length > 0 ? (
            <ul className="stats-user-list">
              {top_users.map((u, i) => (
                <li key={u.user} className="stats-user-item">
                  <span className="stats-user-rank">{i + 1}</span>
                  <span className="stats-user-name">{u.user}</span>
                  <span className="stats-user-meta">
                    {u.jobs} job{u.jobs !== 1 ? "s" : ""} · {u.tracks} track
                    {u.tracks !== 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="stats-chart-empty">
              No social-login activity yet. Job owners appear here when authenticated via
              OIDC/GitHub.
            </div>
          )}
        </div>

        <div className="stats-chart-card stats-chart-card--wide">
          <h2 className="stats-chart-title">Genres</h2>
          {genreData.length > 0 ? (
            <>
              <div className="stats-chart-bars">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={genreData} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      domain={[0, maxGenreCount]}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="genre"
                      width={110}
                      stroke="#64748b"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "0.5rem",
                      }}
                      itemStyle={{ color: "#e2e8f0" }}
                      cursor={{ fill: "#33415533" }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {genreData.map((g, i) => (
                        <Cell
                          key={g.genre}
                          fill={["#3b82f6", "#40e0d0", "#f59e0b", "#a855f7"][i % 4]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="stats-genre-list">
                {genreData.map((g) => (
                  <span key={g.genre} className="stats-genre-item">
                    <span className="stats-genre-name">{g.genre}</span>
                    <span className="stats-genre-count">{g.count}</span>
                  </span>
                ))}
              </div>
              {genres.length > 10 && (
                <div className="stats-chart-note">Showing top 10 of {genres.length} genres.</div>
              )}
            </>
          ) : (
            <div className="stats-chart-empty">
              No genre data yet. Genres are resolved for albums as they are downloaded.
            </div>
          )}
        </div>
      </div>

      <div className="stats-color-hint">
        <span className="stats-color-hint-label">Legend:</span>
        <span className="stats-color-hint-value" style={{ color: COLORS.blueText }}>
          blue
        </span>
        <span className="stats-color-hint-sep">=</span>
        <span className="stats-color-hint-value">albums</span>
        <span className="stats-color-hint-sep">·</span>
        <span className="stats-color-hint-value" style={{ color: COLORS.turquoise }}>
          turquoise
        </span>
        <span className="stats-color-hint-sep">=</span>
        <span className="stats-color-hint-value">playlists</span>
      </div>
    </div>
  );
}

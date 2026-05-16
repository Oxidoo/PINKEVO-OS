import "server-only";
import { getGoogleAccessToken } from "./token";

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface GscSummary {
  totalClicks: number;
  totalImpressions: number;
  topQueries: GscQueryRow[];
  connected: boolean;
}

/**
 * Pull Search Console performance for a site over the last `days` days.
 * Falls back to a deterministic mock when the user isn't GSC-connected.
 */
export async function fetchGscSummary(
  userId: string,
  siteUrl: string,
  days = 120,
): Promise<GscSummary> {
  const token = await getGoogleAccessToken(userId);
  if (!token) {
    return {
      connected: false,
      totalClicks: 0,
      totalImpressions: 0,
      topQueries: [],
    };
  }

  const end = new Date();
  const start = new Date(Date.now() - days * 86_400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: fmt(start),
        endDate: fmt(end),
        dimensions: ["query"],
        rowLimit: 25,
      }),
    },
  );
  if (!res.ok) {
    return { connected: true, totalClicks: 0, totalImpressions: 0, topQueries: [] };
  }
  const data = (await res.json()) as {
    rows?: Array<{ keys: string[]; clicks: number; impressions: number; position: number }>;
  };
  const rows = data.rows ?? [];
  return {
    connected: true,
    totalClicks: rows.reduce((s, r) => s + r.clicks, 0),
    totalImpressions: rows.reduce((s, r) => s + r.impressions, 0),
    topQueries: rows.slice(0, 15).map((r) => ({
      query: r.keys[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      position: Math.round(r.position * 10) / 10,
    })),
  };
}

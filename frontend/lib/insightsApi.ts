import { DashboardStatsRaw } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// A separate fetch from lib/api.ts's getDashboardStats() (which hardcodes
// timeline_days=14 for the dashboard's own 7-day-vs-prior-week chart).
// /insights needs the full 90-day window so its period toggle can derive
// 7d/30d/90d aggregates client-side from real per-day numbers, rather than
// hitting the backend three times or faking the deltas.
export async function getInsightsRaw(): Promise<DashboardStatsRaw> {
  const res = await fetch(`${API_URL}/api/dashboard/stats?timeline_days=90&scan_limit=200`);
  if (!res.ok) {
    throw new Error(`Failed to fetch insights stats: ${res.status}`);
  }
  return res.json();
}

import {
  CommunicationVerifyResult,
  ContentAnalysisResult,
  DashboardStats,
  DashboardStatsRaw,
  LastScanResult,
  MediaAnalysisResult,
  TimelinePoint,
  UrlAnalysisResult,
  WeekPoint,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? `Request to ${path} failed with status ${res.status}`);
  }
  return res.json();
}

export function analyzeURL(url: string): Promise<UrlAnalysisResult> {
  return postJson("/api/analyze/url", { url });
}

export function analyzeContent(text: string): Promise<ContentAnalysisResult> {
  return postJson("/api/analyze/content", { text });
}

export async function analyzeMedia(file: File): Promise<MediaAnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/analyze/media`, { method: "POST", body: formData });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? `Media analysis failed with status ${res.status}`);
  }
  return res.json();
}

export function verifyCommunication(text: string): Promise<CommunicationVerifyResult> {
  return postJson("/api/verify/communication", { text });
}

export async function verifyCommunicationFile(file: File): Promise<CommunicationVerifyResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/verify/communication/file`, { method: "POST", body: formData });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? `Verification failed with status ${res.status}`);
  }
  return res.json();
}

function riskLevel(score: number): "high" | "medium" | "safe" {
  if (score >= 65) return "high";
  if (score >= 35) return "medium";
  return "safe";
}

export function toLastScanResult(
  kind: "url" | "content" | "media",
  subject: string,
  result: UrlAnalysisResult | ContentAnalysisResult | MediaAnalysisResult
): LastScanResult {
  if (kind === "media") {
    const r = result as MediaAnalysisResult;
    const level = r.verdict === "SYNTHETIC_SUSPECTED" ? "high" : r.verdict === "INCONCLUSIVE" ? "medium" : "safe";
    return {
      subject,
      verdict: r.verdict,
      riskScore: r.synthetic_score,
      level,
      shap: [],
      firedRules: r.reasons.map((reason) => ({ name: reason, score: 0 })),
    };
  }
  const r = result as UrlAnalysisResult | ContentAnalysisResult;
  return {
    subject,
    verdict: r.verdict,
    riskScore: r.risk_score,
    level: riskLevel(r.risk_score),
    shap: "shap_contributions" in r ? r.shap_contributions : [],
    firedRules: r.fired_rules,
  };
}

/**
 * GET /api/dashboard/stats returns aggregate_risk_score, scans_count,
 * exchanges_count, all_threats_pct, detection_rate, false_positive_rate,
 * scan_history, etc. — there is no "accuracy", "high_risk_count", or
 * "rules_fired" field on the backend, and per the brief the backend/routers
 * are off-limits. Every field below is either a direct passthrough or a
 * value derived purely from real fields already in the response:
 *
 * - accuracy            <- detection_rate (the model's holdout recall,
 *                           already the dashboard's "DETECTION %" figure
 *                           elsewhere in this app)
 * - high_risk_count      <- round(all_threats_pct/100 * total_scans), an
 *                           exact count of all threat-verdict scans (the
 *                           API only samples 6 rows into scan_history, so
 *                           this recovers the true total from the % + count
 *                           it already returns)
 * - high_risk_delta_pct  <- this-week vs prior-week total_scans, computed
 *                           from a 14-day timeline window (timeline_days is
 *                           an existing, already-supported query param)
 * - recent_scans         <- scan_history, sliced to 5
 * - timeline             <- the 7-day this-week/prior-week pairing used by
 *                           ThreatChart, built from the same 14-day window
 *
 * "Rules fired" has no dashboard-wide equivalent at all (the aggregate
 * endpoint doesn't expose per-scan rule arrays), so it isn't sourced here —
 * the dashboard page tracks it from the most recent live scan instead.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_URL}/api/dashboard/stats?timeline_days=14`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard stats: ${res.status}`);
  }
  const raw: DashboardStatsRaw = await res.json();

  // The backend only returns one timeline entry per day that actually had a
  // scan (see backend/routers/dashboard.py's _build_timeline) — it does NOT
  // pad in empty days. With all activity on a single calendar day, e.g.,
  // that's a 1-point array, and Recharts can't draw a line through a single
  // point (silently renders just the axes, no visible line at all). Reindex
  // onto a real, continuous 14-day calendar window here so the chart always
  // has a full 7-point line to draw, with real values on days that have
  // them and zero — not fabricated — on days that don't.
  const byDate = new Map(raw.timeline.map((p) => [p.date, p]));
  const today = new Date();
  const continuous: TimelinePoint[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (13 - i));
    const date = d.toISOString().slice(0, 10);
    const point = byDate.get(date);
    return {
      date,
      phishing_count: point?.phishing_count ?? 0,
      deepfake_count: point?.deepfake_count ?? 0,
      total_scans: point?.total_scans ?? 0,
    };
  });

  const priorWeek = continuous.slice(0, 7);
  const thisWeek = continuous.slice(7);

  const sum = (points: TimelinePoint[], key: "total_scans" | "phishing_count" | "deepfake_count") =>
    points.reduce((acc, p) => acc + p[key], 0);

  const thisWeekTotal = sum(thisWeek, "total_scans");
  const priorWeekTotal = sum(priorWeek, "total_scans");
  const highRiskDeltaPct =
    priorWeekTotal > 0 ? Math.round(((thisWeekTotal - priorWeekTotal) / priorWeekTotal) * 1000) / 10 : null;

  const timeline: WeekPoint[] = thisWeek.map((point, idx) => ({
    date: point.date,
    thisWeek: point.total_scans,
    priorWeek: priorWeek[idx].total_scans,
  }));

  return {
    phishing_count: raw.phishing_count,
    deepfake_count: raw.deepfake_count,
    accuracy: raw.detection_rate,
    total_scans: raw.total_scans,
    high_risk_count: Math.round((raw.all_threats_pct / 100) * raw.total_scans),
    high_risk_delta_pct: highRiskDeltaPct,
    recent_scans: raw.scan_history.slice(0, 5),
    active_threats: raw.active_threats,
    timeline,
  };
}

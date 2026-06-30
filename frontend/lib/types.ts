export type UrlVerdict = "SAFE" | "SUSPICIOUS" | "PHISHING";
export type MediaVerdict = "SYNTHETIC_SUSPECTED" | "INCONCLUSIVE" | "LIKELY_AUTHENTIC";
export type AnyVerdict = UrlVerdict | MediaVerdict | string;

export interface FiredRule {
  name: string;
  description?: string;
  score: number;
  matched_phrases?: string[];
}

export interface ShapContribution {
  feature: string;
  value: number;
  shap_value: number;
}

export interface UrlAnalysisResult {
  url: string;
  verdict: UrlVerdict;
  risk_score: number;
  ml_probability: number;
  rule_score: number;
  fired_rules: FiredRule[];
  shap_contributions: ShapContribution[];
  features: Record<string, number>;
  model_type: string;
}

export interface ContentAnalysisResult {
  verdict: UrlVerdict;
  risk_score: number;
  ml_probability: number;
  keyword_score: number;
  fired_rules: FiredRule[];
}

export interface MediaAnalysisResult {
  verdict: MediaVerdict;
  synthetic_score: number;
  reasons: string[];
  metadata: {
    filename?: string;
    content_type?: string;
    size_bytes?: number;
    sha256?: string;
    width?: number;
    height?: number;
    has_exif?: boolean;
    has_camera_metadata?: boolean;
    software_tag?: string | null;
  };
  frequency_analysis?: {
    low_freq_energy_ratio: number;
    periodic_peak_z_score: number;
  };
}

export interface CommunicationVerifyResult {
  verified: boolean;
  exact_match: boolean;
  hash: string;
  source: string | null;
  registered_at: string | null;
  similarity?: number;
  lookup_method: string;
  note?: string;
}

// ---- Raw shape of GET /api/dashboard/stats (backend/routers/dashboard.py) ----
export interface TimelinePoint {
  date: string;
  phishing_count: number;
  deepfake_count: number;
  total_scans: number;
}

export interface ActiveThreat {
  id: string;
  label: string;
  subtext: string;
  threat_type: string;
  verdict: string;
}

export interface ScanHistoryRow {
  id: string;
  risk_score: number;
  verdict: string;
  risk_label: string;
  hash: string;
  url: string;
  timestamp: string;
}

export interface DashboardStatsRaw {
  aggregate_risk_score: number;
  total_scans: number;
  scans_count: number;
  exchanges_count: number;
  phishing_count: number;
  deepfake_count: number;
  all_threats_pct: number;
  detection_rate: number;
  false_positive_rate: number;
  timeline: TimelinePoint[];
  active_threats: ActiveThreat[];
  scan_history: ScanHistoryRow[];
}

// ---- UI-facing shape consumed by the dashboard components ----
// Derived entirely from DashboardStatsRaw in lib/api.ts — see comments there
// for exactly how accuracy / high_risk_count map onto real API fields (the
// backend has no literal "accuracy" or "high_risk_count" field).
export interface WeekPoint {
  date: string;
  thisWeek: number;
  priorWeek: number;
}

export interface DashboardStats {
  phishing_count: number;
  deepfake_count: number;
  accuracy: number;
  total_scans: number;
  high_risk_count: number;
  high_risk_delta_pct: number | null;
  recent_scans: ScanHistoryRow[];
  active_threats: ActiveThreat[];
  timeline: WeekPoint[];
}

// Last-scan result shown in the right-panel ScanResultCard / analyze tabs.
// Normalized across the three analyze endpoints, which return different
// field shapes (UrlAnalysisResult.shap_contributions vs
// ContentAnalysisResult.fired_rules vs MediaAnalysisResult.reasons).
export interface LastScanResult {
  subject: string;
  verdict: string;
  riskScore: number;
  level: "high" | "medium" | "safe";
  shap: ShapContribution[];
  firedRules: FiredRule[];
}

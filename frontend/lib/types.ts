export type UrlVerdict = "SAFE" | "SUSPICIOUS" | "PHISHING";
export type MediaVerdict = "SYNTHETIC_SUSPECTED" | "INCONCLUSIVE" | "LIKELY_AUTHENTIC";
export type AnyVerdict = UrlVerdict | MediaVerdict;

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

export interface DashboardStats {
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

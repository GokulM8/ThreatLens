import Link from "next/link";
import { ActiveThreat } from "@/lib/types";

function iconTone(verdict: string): { bg: string; color: string } {
  if (verdict === "PHISHING" || verdict === "SYNTHETIC_SUSPECTED") return { bg: "#fff0f0", color: "#E24B4A" };
  return { bg: "#fff8ed", color: "#EF9F27" };
}

function actionFor(threatType: string): { label: string; bg: string; color: string } {
  if (threatType === "deepfake") return { label: "Flag", bg: "#fff8ed", color: "#EF9F27" };
  return { label: "Block", bg: "#fff0f0", color: "#E24B4A" };
}

// Only "phishing" threats carry an actual URL in `subtext` (the dashboard
// API's other type labels — "scam text", "deepfake", "lookalike" — point at
// content/media/communication scans, which have no equivalent text input to
// prefill on the URL tab).
function analyzeHref(threat: ActiveThreat): string {
  if (threat.threat_type === "phishing") {
    return `/analyze?tab=url&url=${encodeURIComponent(threat.subtext)}`;
  }
  if (threat.threat_type === "scam text") return "/analyze?tab=email";
  if (threat.threat_type === "deepfake") return "/analyze?tab=media";
  return "/analyze?tab=comm";
}

interface ActiveThreatsProps {
  threats: ActiveThreat[];
  totalScans: number;
}

export default function ActiveThreats({ threats, totalScans }: ActiveThreatsProps) {
  return (
    <div className="rounded-card border border-hair border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">Active threats</p>
        <span className="text-xs text-text-muted">
          {threats.length}/{totalScans}
        </span>
      </div>

      <div className="mt-3 space-y-3">
        {threats.length === 0 && <p className="text-xs text-text-muted">No active threats right now.</p>}
        {threats.map((threat) => {
          const tone = iconTone(threat.verdict);
          const action = actionFor(threat.threat_type);
          return (
            <div key={threat.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-btn text-2xs font-semibold"
                  style={{ backgroundColor: tone.bg, color: tone.color }}
                >
                  {threat.label}
                </div>
                <div className="min-w-0">
                  <p className="max-w-[110px] truncate text-xs text-text-primary">{threat.subtext}</p>
                  <p className="text-2xs capitalize text-text-muted">{threat.threat_type}</p>
                </div>
              </div>
              <Link
                href={analyzeHref(threat)}
                className="rounded-pill px-2.5 py-1 text-2xs font-semibold"
                style={{ backgroundColor: action.bg, color: action.color }}
              >
                {action.label}
              </Link>
            </div>
          );
        })}
      </div>

      <Link href="/history?filter=high" className="mt-3 block text-right text-xs text-accent">
        View more →
      </Link>
    </div>
  );
}

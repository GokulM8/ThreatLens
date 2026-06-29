import { ActiveThreat } from "@/lib/types";
import Avatar from "../ui/Avatar";

interface ActiveThreatsPanelProps {
  threats: ActiveThreat[];
  totalScans: number;
}

function avatarColor(verdict: string): string {
  if (verdict === "PHISHING" || verdict === "SYNTHETIC_SUSPECTED") return "#E24B4A";
  return "#EF9F27";
}

function actionFor(threatType: string): { label: string; color: string } {
  if (threatType === "deepfake") return { label: "Flag", color: "#E24B4A" };
  return { label: "Block", color: "#1D9E75" };
}

export default function ActiveThreatsPanel({ threats, totalScans }: ActiveThreatsPanelProps) {
  return (
    <div className="rounded-card border border-hair border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Active threats</h3>
        <span className="text-xs text-text-muted">
          {threats.length}/{totalScans}
        </span>
      </div>

      <div className="mt-3 space-y-3">
        {threats.length === 0 && <p className="text-xs text-text-muted">No active threats right now.</p>}
        {threats.map((threat) => {
          const action = actionFor(threat.threat_type);
          return (
            <div key={threat.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar label={threat.label} size={26} color={avatarColor(threat.verdict)} />
                <div className="min-w-0">
                  <p className="max-w-[120px] truncate text-xs text-text-primary">{threat.subtext}</p>
                  <p className="text-2xs capitalize text-text-muted">{threat.threat_type}</p>
                </div>
              </div>
              <button
                className="rounded-pill border px-2.5 py-1 text-2xs font-medium"
                style={{ borderColor: action.color, color: action.color }}
              >
                {action.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

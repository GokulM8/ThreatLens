import { AlertTriangle, Share2, Sparkles } from "lucide-react";
import CardLabel from "../ui/CardLabel";
import Button from "../ui/Button";
import { ShapContribution } from "@/lib/types";

interface ResultCardProps {
  riskScore: number;
  shapContributions: ShapContribution[];
  onAnalyzeDeeper: () => void;
}

const SEGMENTS = [
  { flex: 3.4, color: "#E24B4A" },
  { flex: 2.1, color: "#EF9F27" },
  { flex: 1.4, color: "#EF9F27" },
  { flex: 3.1, color: "#0e1820" },
];

function riskLevel(score: number): { label: string; color: string } {
  if (score >= 65) return { label: "HIGH", color: "#E24B4A" };
  if (score >= 35) return { label: "MEDIUM", color: "#EF9F27" };
  return { label: "LOW", color: "#1D9E75" };
}

function shapColor(value: number): string {
  if (value > 0.15) return "#E24B4A";
  if (value > 0) return "#EF9F27";
  return "#1D9E75";
}

export default function ResultCard({ riskScore, shapContributions, onAnalyzeDeeper }: ResultCardProps) {
  const level = riskLevel(riskScore);
  const maxAbs = Math.max(...shapContributions.map((c) => Math.abs(c.shap_value)), 0.0001);

  return (
    <div
      className="rounded-card border border-hair border-border bg-surface p-4"
      style={{ borderTop: "1.5px solid #1D9E75" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <CardLabel>Risk_Score</CardLabel>
          <p className="text-hero-lg leading-none" style={{ color: level.color }}>
            {Math.round(riskScore)}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            score/100 · {level.label}
          </p>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-btn"
          style={{ backgroundColor: "#130808", border: "1px solid #2a1010", color: "#E24B4A" }}
        >
          <AlertTriangle size={16} />
        </div>
      </div>

      <div className="mt-4">
        <CardLabel>Shap_Breakdown</CardLabel>
        <div className="mt-2 flex h-1 gap-0.5">
          {SEGMENTS.map((seg, idx) => (
            <div key={idx} style={{ flex: seg.flex, backgroundColor: seg.color, borderRadius: 2 }} />
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {shapContributions.length === 0 && (
          <p className="text-xs text-text-muted">Run a scan to see feature contributions.</p>
        )}
        {shapContributions.map((c) => {
          const color = shapColor(c.shap_value);
          const widthPct = (Math.abs(c.shap_value) / maxAbs) * 100;
          return (
            <div key={c.feature} className="flex items-center gap-2">
              <span className="w-20 shrink-0 truncate text-xs text-text-secondary">
                {c.feature}
              </span>
              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-surface-inner">
                <div className="h-[3px] rounded-full" style={{ width: `${widthPct}%`, backgroundColor: color }} />
              </div>
              <span className="w-12 shrink-0 text-right text-xs font-medium" style={{ color }}>
                {c.shap_value > 0 ? "+" : ""}
                {c.shap_value.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button variant="primary" className="flex-1" onClick={onAnalyzeDeeper}>
          Analyze deeper
        </Button>
        <Button variant="ghost">
          <Sparkles size={13} />
        </Button>
        <Button variant="ghost">
          <Share2 size={13} />
        </Button>
      </div>
    </div>
  );
}

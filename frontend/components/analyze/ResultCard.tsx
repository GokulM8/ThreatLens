import { AlertTriangle } from "lucide-react";
import { LastScanResult } from "@/lib/types";

const LEVEL_COLOR: Record<LastScanResult["level"], string> = {
  high: "#E24B4A",
  medium: "#EF9F27",
  safe: "#1D9E75",
};

const SEGMENTS = [
  { flex: 3.4, color: "#E24B4A" },
  { flex: 2.1, color: "#EF9F27" },
  { flex: 1.4, color: "#EF9F27" },
  { flex: 3, color: "#222222" },
];

function shapBarColor(value: number): string {
  if (value > 0.15) return "#E24B4A";
  if (value > 0) return "#EF9F27";
  return "#555555";
}

interface ResultCardProps {
  result: LastScanResult | null;
  placeholder?: string;
}

export default function ResultCard({ result, placeholder = "Paste a URL above to scan" }: ResultCardProps) {
  if (!result) {
    return (
      <div className="rounded-card bg-scan-card p-3.5">
        <p className="py-6 text-center text-xs text-[#aaaaaa]">{placeholder}</p>
      </div>
    );
  }

  const color = LEVEL_COLOR[result.level];
  const shapRows = result.shap.slice(0, 4);
  const maxAbs = Math.max(...shapRows.map((r) => Math.abs(r.shap_value)), 0.0001);
  const pills = result.firedRules.slice(0, 4);

  return (
    <div className="rounded-card bg-scan-card p-3.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[1px] text-[#555555]">Risk_score</p>
          <span className="text-[40px] font-black leading-none" style={{ color }}>
            {Math.round(result.riskScore)}
          </span>
          <span className="ml-1 font-mono text-[9px] text-[#555555]">/100</span>
        </div>
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: "#1a0808", border: "1px solid #2a1010" }}
        >
          <AlertTriangle size={13} color="#E24B4A" />
        </div>
      </div>

      <div className="mt-3 flex h-[3px] gap-0.5">
        {SEGMENTS.map((seg, i) => (
          <div key={i} style={{ flex: seg.flex, backgroundColor: seg.color, borderRadius: 1 }} />
        ))}
      </div>

      {shapRows.length > 0 ? (
        <div className="mt-3.5">
          <p className="font-mono text-[8px] uppercase tracking-[1px] text-[#444444]">Shap_breakdown</p>
          <div className="mt-2 space-y-1.5">
            {shapRows.map((row) => {
              const barColor = shapBarColor(row.shap_value);
              const widthPct = (Math.abs(row.shap_value) / maxAbs) * 100;
              return (
                <div key={row.feature} className="flex items-center gap-2">
                  <span className="w-[65px] shrink-0 truncate font-mono text-[8px] text-[#444444]">
                    {row.feature}
                  </span>
                  <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-[#222222]">
                    <div
                      className="h-[2px] rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right font-mono text-[8px] font-medium" style={{ color: barColor }}>
                    {row.shap_value > 0 ? "+" : ""}
                    {row.shap_value.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-3.5">
          <p className="font-mono text-[8px] uppercase tracking-[1px] text-[#444444]">Synthetic_probability</p>
          <div className="mt-2 h-[2px] overflow-hidden rounded-full bg-[#222222]">
            <div
              className="h-[2px] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(result.riskScore, 100)}%`, backgroundColor: color }}
            />
          </div>
        </div>
      )}

      {pills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pills.map((rule) => (
            <span
              key={rule.name}
              className="rounded-full px-2 py-0.5 font-mono text-[8px] font-medium"
              style={{ backgroundColor: "rgba(226,75,74,0.1)", color: "#E24B4A", border: "1px solid rgba(226,75,74,0.25)" }}
            >
              {rule.name}
            </span>
          ))}
        </div>
      )}

      <button className="mt-3.5 flex w-full items-center justify-center rounded-md bg-white py-2 text-xs font-bold text-[#111111]">
        Analyze deeper →
      </button>
    </div>
  );
}

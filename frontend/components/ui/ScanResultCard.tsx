import Link from "next/link";
import { LastScanResult } from "@/lib/types";
import { LogoIcon } from "./Logo";

const LEVEL_COLOR: Record<LastScanResult["level"], string> = {
  high: "#E24B4A",
  medium: "#EF9F27",
  safe: "#1D9E75",
};

const LEVEL_TITLE: Record<LastScanResult["level"], string> = {
  high: "Threat\nDetected",
  medium: "Suspicious\nActivity",
  safe: "Safe",
};

const LEVEL_LABEL: Record<LastScanResult["level"], string> = {
  high: "HIGH RISK",
  medium: "MEDIUM RISK",
  safe: "LOW RISK",
};

function shapBarColor(value: number): string {
  if (value > 0.15) return "#E24B4A";
  if (value > 0) return "#EF9F27";
  return "#555555";
}

interface ScanResultCardProps {
  result: LastScanResult | null;
}

export default function ScanResultCard({ result }: ScanResultCardProps) {
  if (!result) {
    return (
      <div className="rounded-card p-4" style={{ backgroundColor: "#111111" }}>
        <p className="text-2xs uppercase tracking-[1.5px] text-[#555555]">Scan result</p>
        <div className="flex flex-col items-center py-8">
          <span className="opacity-20">
            <LogoIcon size={40} mode="light" />
          </span>
          <p className="mt-3 text-center text-sm text-[#cccccc]">Paste a URL in /analyze to see results here</p>
        </div>
      </div>
    );
  }

  const color = LEVEL_COLOR[result.level];
  const shapRows = result.shap.slice(0, 4);
  const pillRules = result.firedRules.slice(0, 3);

  return (
    <div className="rounded-card p-4" style={{ backgroundColor: "#111111" }}>
      <div
        className="mb-3 inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-2xs font-semibold"
        style={{ backgroundColor: "rgba(29,158,117,0.12)", border: "0.5px solid rgba(29,158,117,0.4)", color: "#1D9E75" }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#1D9E75" }} />
        Live result
      </div>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xs uppercase tracking-[1.5px] text-[#555555]">Scan result</p>
          <p className="mt-1 whitespace-pre-line text-sm font-bold leading-tight text-white">
            {LEVEL_TITLE[result.level]}
          </p>
          <p className="mt-1 max-w-[160px] truncate font-mono text-xs text-[#555555]">{result.subject}</p>
        </div>
      </div>

      <p className="mt-4 text-hero-lg leading-none" style={{ color }}>
        {Math.round(result.riskScore)}
      </p>
      <p className="mt-1 text-xs text-[#555555]">
        score/100 · {LEVEL_LABEL[result.level]}
      </p>

      <div className="mt-3 h-1 overflow-hidden rounded-[3px]" style={{ backgroundColor: "#222222" }}>
        <div
          className="h-1 rounded-[3px]"
          style={{
            width: `${Math.min(Math.max(result.riskScore, 4), 100)}%`,
            background: "linear-gradient(90deg, #E24B4A, #EF9F27)",
          }}
        />
      </div>

      {shapRows.length > 0 && (
        <div className="mt-4">
          <p className="text-2xs uppercase tracking-[1.5px] text-[#555555]">SHAP breakdown</p>
          <div className="mt-2 space-y-1.5">
            {shapRows.map((row) => {
              const barColor = shapBarColor(row.shap_value);
              const maxAbs = Math.max(...shapRows.map((r) => Math.abs(r.shap_value)), 0.0001);
              const widthPct = (Math.abs(row.shap_value) / maxAbs) * 100;
              return (
                <div key={row.feature} className="flex items-center gap-2">
                  <span className="w-[65px] shrink-0 truncate text-2xs text-[#666666]">{row.feature}</span>
                  <div className="h-0.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "#222222" }}>
                    <div className="h-0.5 rounded-full" style={{ width: `${widthPct}%`, backgroundColor: barColor }} />
                  </div>
                  <span className="w-9 shrink-0 text-right text-2xs font-medium" style={{ color: barColor }}>
                    {row.shap_value > 0 ? "+" : ""}
                    {row.shap_value.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pillRules.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pillRules.map((rule) => (
            <span
              key={rule.name}
              className="rounded-pill px-2 py-1 text-2xs font-medium"
              style={{ backgroundColor: "#2a0808", color: "#E24B4A", border: "0.5px solid #4a1010" }}
            >
              {rule.name}
            </span>
          ))}
        </div>
      )}

      <Link
        href="/analyze"
        className="mt-4 flex w-full items-center justify-center rounded-btn bg-white py-2 text-sm font-bold text-[#111111]"
      >
        Analyze deeper →
      </Link>
    </div>
  );
}

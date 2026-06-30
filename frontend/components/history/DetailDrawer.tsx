import { X } from "lucide-react";
import { ScanHistoryRow } from "@/lib/types";

function riskTone(label: string): { bg: string; color: string } {
  if (label === "High risk") return { bg: "#fff0f0", color: "#E24B4A" };
  if (label === "Medium") return { bg: "#fff8ed", color: "#EF9F27" };
  return { bg: "#f0faf5", color: "#1D9E75" };
}

interface DetailDrawerProps {
  scan: ScanHistoryRow | null;
  onClose: () => void;
}

export default function DetailDrawer({ scan, onClose }: DetailDrawerProps) {
  if (!scan) return null;
  const tone = riskTone(scan.risk_label);

  return (
    <div className="fixed bottom-0 right-0 top-0 z-50 w-[280px] border-l border-hair border-border bg-card p-4 shadow-scanner">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-primary">Scan detail</p>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 rounded-card bg-scan-card p-3.5">
        <p className="font-mono text-[8px] uppercase tracking-[1px] text-[#555555]">Target</p>
        <p className="mt-1 break-all font-mono text-[10px] text-white">{scan.url}</p>

        <p className="mt-3 text-[40px] font-black leading-none" style={{ color: tone.color }}>
          {Math.round(scan.risk_score)}
        </p>
        <span className="font-mono text-[9px] text-[#555555]">score/100</span>

        <div className="mt-3">
          <span
            className="rounded-pill px-2 py-0.5 text-[9px] font-semibold"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: tone.color }}
          >
            {scan.verdict}
          </span>
        </div>

        <p className="mt-4 text-[10px] leading-relaxed text-[#777777]">
          Detailed SHAP/rule breakdown is only captured for live scans, not retroactively for past history — this
          drawer shows everything the dashboard API stores for this row.
        </p>
      </div>

      <div className="mt-3 rounded-btn border border-hair border-border p-2.5">
        <p className="text-[9px] text-text-muted">Hash</p>
        <p className="mt-0.5 break-all font-mono text-[9px] text-text-secondary">{scan.hash}</p>
      </div>

      <div className="mt-2 rounded-btn border border-hair border-border p-2.5">
        <p className="text-[9px] text-text-muted">Scanned at</p>
        <p className="mt-0.5 text-[10px] text-text-secondary">{new Date(scan.timestamp).toUTCString()}</p>
      </div>
    </div>
  );
}

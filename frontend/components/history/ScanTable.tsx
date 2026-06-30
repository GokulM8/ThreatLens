import { ScanHistoryRow } from "@/lib/types";

function scanType(url: string): string {
  const match = url.match(/^<(.+)-submission>$/);
  return match ? match[1] : "url";
}

function initials(url: string): string {
  const type = scanType(url);
  if (type !== "url") return type.slice(0, 2).toUpperCase();
  const hostname = url.replace(/^https?:\/\//, "").split("/")[0];
  return hostname.slice(0, 2).toUpperCase();
}

function riskTone(label: string): { bg: string; color: string } {
  if (label === "High risk") return { bg: "#fff0f0", color: "#E24B4A" };
  if (label === "Medium") return { bg: "#fff8ed", color: "#EF9F27" };
  return { bg: "#f0faf5", color: "#1D9E75" };
}

const GRID_COLS = "2.5fr 80px 80px 80px 60px 30px";

interface ScanTableProps {
  rows: ScanHistoryRow[];
  onRowClick: (row: ScanHistoryRow) => void;
}

export default function ScanTable({ rows, onRowClick }: ScanTableProps) {
  return (
    <div className="overflow-hidden rounded-card border border-hair border-border bg-card">
      <div
        className="grid items-center gap-1.5 border-b border-[#f5f5f5] px-3 py-2"
        style={{ gridTemplateColumns: GRID_COLS }}
      >
        {["Target", "Type", "Score", "Verdict", "Time", ""].map((h) => (
          <span key={h} className="text-[8px] font-semibold uppercase tracking-[1px] text-[#cccccc]">
            {h}
          </span>
        ))}
      </div>

      {rows.length === 0 && <p className="px-3 py-6 text-center text-xs text-text-muted">No scans match this filter.</p>}

      {rows.map((row) => {
        const type = scanType(row.url);
        const tone = riskTone(row.risk_label);
        return (
          <div
            key={row.id}
            onClick={() => onRowClick(row)}
            className="grid cursor-pointer items-center gap-1.5 border-b border-[#f8f8f8] px-3 py-2 transition-colors hover:bg-[#fafafa] last:border-0"
            style={{ gridTemplateColumns: GRID_COLS }}
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-text-primary"
                style={{ backgroundColor: tone.bg }}
              >
                {initials(row.url)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-medium text-text-primary">{row.url}</p>
                <p className="truncate text-[9px] text-text-muted">{row.hash}</p>
              </div>
            </div>
            <span className="text-[10px] text-[#888888]">{type}</span>
            <span className="text-[10px] font-bold" style={{ color: tone.color }}>
              {Math.round(row.risk_score)}
            </span>
            <span>
              <span
                className="rounded-pill px-2 py-0.5 text-[9px] font-semibold"
                style={{ backgroundColor: tone.bg, color: tone.color }}
              >
                {row.risk_label}
              </span>
            </span>
            <span className="font-mono text-[9px] text-text-muted">
              {new Date(row.timestamp).toISOString().slice(11, 16)}
            </span>
            <span className="text-[#dddddd]">›</span>
          </div>
        );
      })}
    </div>
  );
}

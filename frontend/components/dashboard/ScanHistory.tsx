import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ScanHistoryRow } from "@/lib/types";

function riskTone(label: string): { bg: string; color: string } {
  if (label === "High risk") return { bg: "#fff0f0", color: "#E24B4A" };
  if (label === "Medium") return { bg: "#fff8ed", color: "#EF9F27" };
  return { bg: "#f0faf5", color: "#1D9E75" };
}

export default function ScanHistory({ rows }: { rows: ScanHistoryRow[] }) {
  return (
    <div className="rounded-card border border-hair border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">Scan history</p>
        <Link href="/history" className="text-xs text-accent">
          View more →
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        {rows.length === 0 && <p className="text-xs text-text-muted">No scans yet.</p>}
        {rows.slice(0, 3).map((row) => {
          const tone = riskTone(row.risk_label);
          return (
            <div key={row.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-btn text-2xs font-semibold"
                  style={{ backgroundColor: tone.bg, color: tone.color }}
                >
                  {String(Math.round(row.risk_score)).padStart(2, "0")}
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: tone.color }}>
                    {row.risk_label}
                  </p>
                  <p className="font-mono text-2xs text-text-muted">{row.hash}</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-text-muted" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

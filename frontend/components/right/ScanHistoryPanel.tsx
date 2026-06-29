import { ChevronRight } from "lucide-react";
import { ScanHistoryRow } from "@/lib/types";
import Avatar from "../ui/Avatar";

function riskColor(label: string): string {
  if (label === "High risk") return "#E24B4A";
  if (label === "Medium") return "#EF9F27";
  return "#1D9E75";
}

export default function ScanHistoryPanel({ rows }: { rows: ScanHistoryRow[] }) {
  return (
    <div className="rounded-card border border-hair border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Scan history</h3>
        <button className="text-xs text-accent">View more →</button>
      </div>

      <div className="mt-3 space-y-3">
        {rows.length === 0 && <p className="text-xs text-text-muted">No scans yet.</p>}
        {rows.map((row) => {
          const color = riskColor(row.risk_label);
          return (
            <div key={row.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar
                  label={String(Math.round(row.risk_score)).padStart(2, "0")}
                  size={28}
                  shape="square"
                  color={color}
                />
                <div>
                  <p className="text-xs font-medium" style={{ color }}>
                    {row.risk_label}
                  </p>
                  <p className="text-2xs text-text-muted">{row.hash}</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-text-secondary" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

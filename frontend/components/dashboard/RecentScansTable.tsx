import Link from "next/link";
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

function shortLabel(label: string): string {
  return label === "High risk" ? "High" : label;
}

const AVATAR_BG: Record<string, string> = {
  url: "#f0faf5",
  media: "#fff8ed",
  content: "#fff0f0",
  communication: "#f5f5f5",
};

export default function RecentScansTable({ rows }: { rows: ScanHistoryRow[] }) {
  return (
    <div className="rounded-card border border-hair border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-section text-text-primary">Recent scans</p>
        <Link href="/history" className="text-xs text-accent">
          View all →
        </Link>
      </div>

      <div className="mt-2">
        {rows.length === 0 && <p className="py-4 text-xs text-text-muted">No scans yet — run one from Analyze.</p>}
        {rows.map((row) => {
          const type = scanType(row.url);
          const tone = riskTone(row.risk_label);
          return (
            <div
              key={row.id}
              className="flex items-center justify-between border-b border-[#f5f5f5] py-2.5 last:border-0 hover:bg-[#fafafa]"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-2xs font-semibold text-text-primary"
                  style={{ backgroundColor: AVATAR_BG[type] ?? "#f5f5f5" }}
                >
                  {initials(row.url)}
                </div>
                <div className="min-w-0">
                  <p className="max-w-[220px] truncate text-sm font-medium text-text-primary">{row.url}</p>
                  <p className="text-xs text-text-muted">
                    {type} scan · {row.verdict}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted">{new Date(row.timestamp).toISOString().slice(11, 16)} UTC</span>
                <span
                  className="rounded-pill px-2.5 py-1 text-2xs font-semibold"
                  style={{ backgroundColor: tone.bg, color: tone.color }}
                >
                  {shortLabel(row.risk_label)} · {Math.round(row.risk_score)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { LastScanResult } from "@/lib/types";

const LEVEL_TONE: Record<LastScanResult["level"], { bg: string; color: string }> = {
  high: { bg: "#fff0f0", color: "#E24B4A" },
  medium: { bg: "#fff8ed", color: "#EF9F27" },
  safe: { bg: "#f0faf5", color: "#1D9E75" },
};

interface SessionHistoryProps {
  items: LastScanResult[];
  onSelect: (item: LastScanResult) => void;
}

export default function SessionHistory({ items, onSelect }: SessionHistoryProps) {
  return (
    <div className="rounded-[10px] border border-hair border-border bg-card p-2.5">
      <p className="text-[10px] font-semibold text-text-primary">This session</p>
      <div className="mt-2 space-y-1.5">
        {items.length === 0 && <p className="py-2 text-[9px] text-text-muted">Scans you run will show up here.</p>}
        {items.map((item, idx) => {
          const tone = LEVEL_TONE[item.level];
          return (
            <button
              key={`${item.subject}-${idx}`}
              onClick={() => onSelect(item)}
              className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-tint-gray"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold"
                style={{ backgroundColor: tone.bg, color: tone.color }}
              >
                {item.subject.slice(0, 2).toUpperCase()}
              </span>
              <span className="flex-1 truncate text-[10px] text-text-secondary">{item.subject}</span>
              <span
                className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold"
                style={{ backgroundColor: tone.bg, color: tone.color }}
              >
                {Math.round(item.riskScore)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

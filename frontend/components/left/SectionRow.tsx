import { MoreHorizontal } from "lucide-react";

interface SectionRowProps {
  scansCount: number;
  exchangesCount: number;
}

export default function SectionRow({ scansCount, exchangesCount }: SectionRowProps) {
  return (
    <div className="mt-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold text-text-primary">
          Scans<sup className="text-2xs text-accent">{scansCount}</sup>
        </h2>
        <h2 className="text-sm font-medium text-text-muted">
          Exchanges<sup className="text-2xs text-text-muted">{exchangesCount}</sup>
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-pill border border-hair border-border bg-surface px-3 py-1 text-xs text-text-secondary">
          Weekly
        </button>
        <button className="text-text-secondary">
          <MoreHorizontal size={15} />
        </button>
      </div>
    </div>
  );
}

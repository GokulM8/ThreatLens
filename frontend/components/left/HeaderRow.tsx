import { Plus, Settings, Sparkles } from "lucide-react";
import Button from "../ui/Button";

interface HeaderRowProps {
  threatsCount: number;
  onNewScan: () => void;
}

export default function HeaderRow({ threatsCount, onNewScan }: HeaderRowProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-section text-text-primary">
        Threats
        <sup className="text-2xs text-text-secondary">{threatsCount}</sup>
      </h1>
      <div className="flex items-center gap-2">
        <button className="flex h-8 w-8 items-center justify-center rounded-btn border border-hair border-border bg-surface text-text-secondary">
          <Sparkles size={14} />
        </button>
        <Button variant="ghost">
          <Settings size={13} />
          Settings
        </Button>
        <Button variant="primary" onClick={onNewScan}>
          <Plus size={13} />
          New scan
        </Button>
      </div>
    </div>
  );
}

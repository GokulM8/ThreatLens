"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import CardLabel from "../ui/CardLabel";
import Toggle from "../ui/Toggle";

interface ScannerStatusCardProps {
  detectionRate: number;
  falsePositiveRate: number;
}

function StatusRow({ label, status, color, on }: { label: string; status: string; color: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-text-primary">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-2xs font-medium" style={{ color }}>
          {status}
        </span>
        <Toggle on={on} onColor={color} />
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between">
        <CardLabel>{label}</CardLabel>
        <span className="text-xs font-semibold" style={{ color }}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-inner">
        <div className="h-1 rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function ScannerStatusCard({ detectionRate, falsePositiveRate }: ScannerStatusCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-card border border-hair border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <CardLabel>Scanner Status</CardLabel>
        <button onClick={() => setExpanded((v) => !v)} className="text-text-secondary">
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {expanded && (
        <>
          <div className="my-3 flex flex-col items-center justify-center py-2">
            <Sparkles size={44} className="text-accent" style={{ opacity: 0.06 }} />
            <span className="-mt-7 text-2xs text-text-muted">Threatlens AI</span>
          </div>

          <div className="divide-y divide-border">
            <StatusRow label="URL Scanner" status="ACTIVE" color="#1D9E75" on />
            <StatusRow label="Media Detector" status="ALERT" color="#E24B4A" on={false} />
          </div>

          <ProgressBar label="Detection" value={detectionRate} color="#1D9E75" />
          <ProgressBar label="False Pos" value={falsePositiveRate} color="#EF9F27" />
        </>
      )}
    </div>
  );
}

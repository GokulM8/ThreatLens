import Badge from "../ui/Badge";
import ThreatChart from "./ThreatChart";
import { DashboardStats } from "@/lib/types";

function MiniStatCard({
  label,
  value,
  valueColor,
  badge,
}: {
  label: string;
  value: string | number;
  valueColor: string;
  badge: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-hair border-border bg-card p-3.5">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="mt-1.5 text-hero" style={{ color: valueColor }}>
        {value}
      </p>
      <div className="mt-2">{badge}</div>
    </div>
  );
}

interface MidRowProps {
  stats: DashboardStats;
  rulesFiredCount: number | null;
}

export default function MidRow({ stats, rulesFiredCount }: MidRowProps) {
  const delta = stats.high_risk_delta_pct;
  const deltaTone = delta === null ? "gray" : delta > 0 ? "danger" : "accent";
  const deltaLabel = delta === null ? "No prior data" : `${delta > 0 ? "+" : ""}${delta}%`;

  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: "220px 1fr" }}>
      <div className="flex flex-col gap-2.5">
        <MiniStatCard
          label="High risk"
          value={stats.high_risk_count}
          valueColor="#111111"
          badge={<Badge tone={deltaTone}>{deltaLabel}</Badge>}
        />
        <MiniStatCard
          label="Rules fired"
          value={rulesFiredCount ?? 0}
          valueColor="#111111"
          badge={<Badge tone="warning">this scan</Badge>}
        />
      </div>
      <ThreatChart data={stats.timeline} />
    </div>
  );
}

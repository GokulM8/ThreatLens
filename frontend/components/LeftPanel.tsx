import { DashboardStats } from "@/lib/types";
import HeaderRow from "./left/HeaderRow";
import RiskCard from "./left/RiskCard";
import ScannerStatusCard from "./left/ScannerStatusCard";
import SectionRow from "./left/SectionRow";
import StatsRow from "./left/StatsRow";
import ThreatTimelineChart from "./left/ThreatTimelineChart";

interface LeftPanelProps {
  stats: DashboardStats;
  onNewScan: () => void;
}

export default function LeftPanel({ stats, onNewScan }: LeftPanelProps) {
  const timestamp = new Date().toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="overflow-y-auto border-r border-hair border-border p-5">
      <HeaderRow threatsCount={stats.phishing_count + stats.deepfake_count} onNewScan={onNewScan} />

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <RiskCard
          riskScore={stats.aggregate_risk_score}
          timestamp={timestamp}
          phishingCount={stats.phishing_count}
        />
        <ScannerStatusCard
          detectionRate={stats.detection_rate}
          falsePositiveRate={stats.false_positive_rate}
        />
      </div>

      <SectionRow scansCount={stats.scans_count} exchangesCount={stats.exchanges_count} />

      <StatsRow
        allThreatsPct={stats.all_threats_pct}
        phishingCount={stats.phishing_count}
        deepfakeCount={stats.deepfake_count}
        totalScans={stats.total_scans}
      />

      <div className="mt-2.5">
        <ThreatTimelineChart data={stats.timeline} />
      </div>
    </div>
  );
}

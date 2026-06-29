import { DashboardStats, ShapContribution } from "@/lib/types";
import ScanResultHeader from "./right/ScanResultHeader";
import ResultCard from "./right/ResultCard";
import ActiveThreatsPanel from "./right/ActiveThreatsPanel";
import ScanHistoryPanel from "./right/ScanHistoryPanel";

interface RightPanelProps {
  stats: DashboardStats;
  lastScanSubject: string;
  lastScanRiskScore: number;
  lastScanShap: ShapContribution[];
  onAnalyzeDeeper: () => void;
}

export default function RightPanel({
  stats,
  lastScanSubject,
  lastScanRiskScore,
  lastScanShap,
  onAnalyzeDeeper,
}: RightPanelProps) {
  return (
    <div className="flex flex-col gap-3 overflow-y-auto bg-bg-secondary p-[18px]" style={{ width: 300 }}>
      <ScanResultHeader subtext={lastScanSubject} />
      <ResultCard
        riskScore={lastScanRiskScore}
        shapContributions={lastScanShap}
        onAnalyzeDeeper={onAnalyzeDeeper}
      />
      <ActiveThreatsPanel threats={stats.active_threats} totalScans={stats.total_scans} />
      <ScanHistoryPanel rows={stats.scan_history} />
    </div>
  );
}

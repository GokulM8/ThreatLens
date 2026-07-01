"use client";

import useSWR from "swr";
import PageTopnav from "@/components/layout/PageTopnav";
import DashboardTopbar from "@/components/layout/DashboardTopbar";
import DashboardRightPanel from "@/components/layout/DashboardRightPanel";
import StatsRow from "@/components/dashboard/StatsRow";
import MidRow from "@/components/dashboard/MidRow";
import RecentScansTable from "@/components/dashboard/RecentScansTable";
import ActiveThreats from "@/components/dashboard/ActiveThreats";
import ScanHistory from "@/components/dashboard/ScanHistory";
import ScanResultCard from "@/components/ui/ScanResultCard";
import { getDashboardStats } from "@/lib/api";
import { useLastScan } from "@/lib/useLastScan";

export default function DashboardPage() {
  const { data: stats, isLoading } = useSWR("dashboard-stats", getDashboardStats, {
    refreshInterval: 30000,
  });
  const { lastScan } = useLastScan();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-page">
      <PageTopnav />

      <div className="grid flex-1 overflow-hidden" style={{ gridTemplateColumns: "1fr 260px" }}>
        <main className="h-full overflow-y-auto">
          <DashboardTopbar
            greetingName="Gokul"
            newThreatsCount={stats ? stats.phishing_count + stats.deepfake_count : 0}
            highRiskCount={stats?.high_risk_count ?? 0}
            activeThreats={stats?.active_threats ?? []}
          />

          {!stats || isLoading ? (
            <div className="px-6 py-10 text-sm text-text-muted">Loading dashboard…</div>
          ) : (
            <div className="flex flex-col gap-3 px-6 pb-8">
              <StatsRow stats={stats} />
              <MidRow stats={stats} rulesFiredCount={lastScan?.firedRules.length ?? null} />
              <RecentScansTable rows={stats.recent_scans} />
            </div>
          )}
        </main>

        <DashboardRightPanel>
          <ScanResultCard result={lastScan} />
          {stats && (
            <>
              <ActiveThreats threats={stats.active_threats} totalScans={stats.total_scans} />
              <ScanHistory rows={stats.recent_scans} />
            </>
          )}
        </DashboardRightPanel>
      </div>
    </div>
  );
}

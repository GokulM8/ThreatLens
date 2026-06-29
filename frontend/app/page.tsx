"use client";

import { useCallback, useEffect, useState } from "react";
import Topnav, { ScanMode } from "@/components/Topnav";
import LeftPanel from "@/components/LeftPanel";
import RightPanel from "@/components/RightPanel";
import ScanModal from "@/components/ScanModal";
import { fetchDashboardStats } from "@/lib/api";
import { DashboardStats, ShapContribution, UrlAnalysisResult } from "@/lib/types";

const EMPTY_STATS: DashboardStats = {
  aggregate_risk_score: 0,
  total_scans: 0,
  scans_count: 0,
  exchanges_count: 0,
  phishing_count: 0,
  deepfake_count: 0,
  all_threats_pct: 0,
  detection_rate: 0,
  false_positive_rate: 0,
  timeline: [],
  active_threats: [],
  scan_history: [],
};

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [activeTab, setActiveTab] = useState<ScanMode>("overview");
  const [modalOpen, setModalOpen] = useState(false);

  const [lastScanSubject, setLastScanSubject] = useState("No scan yet");
  const [lastScanRiskScore, setLastScanRiskScore] = useState(0);
  const [lastScanShap, setLastScanShap] = useState<ShapContribution[]>([]);

  const refreshStats = useCallback(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(() => setStats(EMPTY_STATS));
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  function handleTabChange(tab: ScanMode) {
    setActiveTab(tab);
    if (tab !== "overview") setModalOpen(true);
  }

  function handleUrlResult(result: UrlAnalysisResult) {
    setLastScanSubject(result.url);
    setLastScanRiskScore(result.risk_score);
    setLastScanShap(result.shap_contributions);
  }

  return (
    <div className="flex min-h-screen flex-col rounded-card border border-hair border-border bg-bg">
      <Topnav activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="grid flex-1" style={{ gridTemplateColumns: "1fr 300px" }}>
        <LeftPanel stats={stats} onNewScan={() => setModalOpen(true)} />
        <RightPanel
          stats={stats}
          lastScanSubject={lastScanSubject}
          lastScanRiskScore={lastScanRiskScore}
          lastScanShap={lastScanShap}
          onAnalyzeDeeper={() => setModalOpen(true)}
        />
      </div>

      {modalOpen && (
        <ScanModal
          initialTab={activeTab}
          onClose={() => {
            setModalOpen(false);
            setActiveTab("overview");
          }}
          onUrlResult={handleUrlResult}
          onAnyResult={refreshStats}
        />
      )}
    </div>
  );
}

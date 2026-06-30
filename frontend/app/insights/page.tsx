"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import PageTopnav from "@/components/layout/PageTopnav";
import PeriodToggle, { Period } from "@/components/insights/PeriodToggle";
import StatCards from "@/components/insights/StatCards";
import OriginMap from "@/components/insights/OriginMap";
import DonutChart from "@/components/insights/DonutChart";
import ShapFeatures from "@/components/insights/ShapFeatures";
import DailyBarChart from "@/components/insights/DailyBarChart";
import { getInsightsRaw } from "@/lib/insightsApi";
import { TimelinePoint } from "@/lib/types";

function sumOver(points: TimelinePoint[], key: "phishing_count" | "deepfake_count" | "total_scans"): number {
  return points.reduce((acc, p) => acc + p[key], 0);
}

function deltaPct(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

export default function InsightsPage() {
  const { data: raw, isLoading } = useSWR("insights-raw", getInsightsRaw, { refreshInterval: 30000 });
  const [period, setPeriod] = useState<Period>(7);

  const periodStats = useMemo(() => {
    const timeline = raw?.timeline ?? [];
    const current = timeline.slice(-period);
    const prior = timeline.slice(-period * 2, -period);

    return {
      phishingCount: sumOver(current, "phishing_count"),
      phishingDeltaPct: deltaPct(sumOver(current, "phishing_count"), sumOver(prior, "phishing_count")),
      deepfakeCount: sumOver(current, "deepfake_count"),
      deepfakeDeltaPct: deltaPct(sumOver(current, "deepfake_count"), sumOver(prior, "deepfake_count")),
      totalScans: sumOver(current, "total_scans"),
    };
  }, [raw, period]);

  const otherCount = Math.max(periodStats.totalScans - periodStats.phishingCount - periodStats.deepfakeCount, 0);

  return (
    <div className="min-h-screen bg-page">
      <PageTopnav rightSlot={<PeriodToggle active={period} onChange={setPeriod} />} />

      <div className="flex flex-col gap-3 p-3.5">
        {isLoading || !raw ? (
          <p className="text-xs text-text-muted">Loading insights…</p>
        ) : (
          <>
            <StatCards
              phishingCount={periodStats.phishingCount}
              phishingDeltaPct={periodStats.phishingDeltaPct}
              deepfakeCount={periodStats.deepfakeCount}
              deepfakeDeltaPct={periodStats.deepfakeDeltaPct}
              accuracy={raw.detection_rate}
            />

            <div className="grid grid-cols-2 gap-2.5">
              <OriginMap />
              <DonutChart
                phishingCount={periodStats.phishingCount}
                deepfakeCount={periodStats.deepfakeCount}
                otherCount={otherCount}
              />
              <ShapFeatures />
              <DailyBarChart timeline={raw.timeline} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

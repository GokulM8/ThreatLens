import { Eye, Link2, ScanLine, ShieldCheck } from "lucide-react";
import StatCard from "../ui/StatCard";
import { DashboardStats } from "@/lib/types";

export default function StatsRow({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      <StatCard
        icon={Link2}
        iconBg="#fff0f0"
        iconColor="#E24B4A"
        value={stats.phishing_count}
        valueColor="#E24B4A"
        label="Phishing URLs detected"
      />
      <StatCard
        icon={Eye}
        iconBg="#fff8ed"
        iconColor="#EF9F27"
        value={stats.deepfake_count}
        valueColor="#EF9F27"
        label="Deepfakes flagged"
      />
      <StatCard
        icon={ShieldCheck}
        iconBg="#f0faf5"
        iconColor="#1D9E75"
        value={`${stats.accuracy}%`}
        valueColor="#1D9E75"
        label="Detection accuracy"
      />
      <StatCard
        icon={ScanLine}
        iconBg="#f5f5f5"
        iconColor="#888888"
        value={stats.total_scans}
        valueColor="#111111"
        label="Total scans run"
      />
    </div>
  );
}

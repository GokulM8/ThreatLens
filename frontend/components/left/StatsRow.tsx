import CardLabel from "../ui/CardLabel";

interface StatsRowProps {
  allThreatsPct: number;
  phishingCount: number;
  deepfakeCount: number;
  totalScans: number;
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-btn border border-hair border-border bg-surface p-2.5">
      <CardLabel>{label}</CardLabel>
      <p className="mt-1 text-sm font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

export default function StatsRow({ allThreatsPct, phishingCount, deepfakeCount, totalScans }: StatsRowProps) {
  return (
    <div className="mt-3 grid grid-cols-4 gap-2">
      <StatBox label="All threats" value={`${allThreatsPct.toFixed(1)}%`} color="#c8e0e8" />
      <StatBox label="Phishing" value={phishingCount.toLocaleString()} color="#E24B4A" />
      <StatBox label="Deepfakes" value={deepfakeCount.toLocaleString()} color="#EF9F27" />
      <StatBox label="Total scans" value={totalScans.toLocaleString()} color="#2a5048" />
    </div>
  );
}

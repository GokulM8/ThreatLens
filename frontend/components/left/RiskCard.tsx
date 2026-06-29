import CardLabel from "../ui/CardLabel";

interface RiskCardProps {
  riskScore: number;
  timestamp: string;
  phishingCount: number;
}

const SEGMENTS = [
  { flex: 3, color: "#E24B4A" },
  { flex: 1, color: "#EF9F27" },
  { flex: 0.5, color: "#0e1820" },
  { flex: 0.5, color: "#0e1820" },
  { flex: 0.5, color: "#0e1820" },
];

function riskColor(score: number): string {
  if (score >= 65) return "#E24B4A";
  if (score >= 35) return "#EF9F27";
  return "#1D9E75";
}

export default function RiskCard({ riskScore, timestamp, phishingCount }: RiskCardProps) {
  return (
    <div
      className="rounded-card border border-hair border-border bg-surface p-4"
      style={{ borderTop: "1.5px solid #1D9E75" }}
    >
      <CardLabel>Total Risk Score</CardLabel>
      <p className="mt-2 text-hero" style={{ color: riskColor(riskScore) }}>
        {riskScore.toFixed(1)}
      </p>
      <p className="mt-1 text-sm text-text-muted">{timestamp}</p>

      <div className="mt-4 flex h-1 gap-0.5">
        {SEGMENTS.map((seg, idx) => (
          <div
            key={idx}
            style={{ flex: seg.flex, backgroundColor: seg.color, borderRadius: 2 }}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <CardLabel>Phishing Active</CardLabel>
          <p className="text-sm font-bold text-accent">{phishingCount.toLocaleString()} threats</p>
        </div>
        <button className="rounded-pill border border-hair border-border bg-surface-inner px-3 py-1.5 text-xs text-text-secondary">
          Details ↓
        </button>
      </div>
    </div>
  );
}

interface StatCardsProps {
  phishingCount: number;
  phishingDeltaPct: number | null;
  deepfakeCount: number;
  deepfakeDeltaPct: number | null;
  accuracy: number;
}

function DeltaLabel({ deltaPct, goodDirection }: { deltaPct: number | null; goodDirection: "down" | "up" }) {
  if (deltaPct === null) return <span className="text-[8px] text-text-muted">no prior data</span>;
  const improved = goodDirection === "down" ? deltaPct <= 0 : deltaPct >= 0;
  const color = improved ? "#1D9E75" : "#E24B4A";
  const arrow = deltaPct >= 0 ? "↑" : "↓";
  return (
    <span className="text-[8px] font-semibold" style={{ color }}>
      {arrow} {Math.abs(deltaPct)}% vs prior period
    </span>
  );
}

function StatCard({
  label,
  value,
  color,
  delta,
}: {
  label: string;
  value: string;
  color: string;
  delta: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-hair border-border bg-card p-2.5">
      <p className="mb-0.5 text-[8px] tracking-[0.5px] text-text-muted">{label}</p>
      <p className="text-[18px] font-bold" style={{ color }}>
        {value}
      </p>
      <div className="mt-0.5">{delta}</div>
    </div>
  );
}

export default function StatCards({ phishingCount, phishingDeltaPct, deepfakeCount, deepfakeDeltaPct, accuracy }: StatCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <StatCard
        label="PHISHING URLS"
        value={String(phishingCount)}
        color="#E24B4A"
        delta={<DeltaLabel deltaPct={phishingDeltaPct} goodDirection="down" />}
      />
      <StatCard
        label="DEEPFAKES"
        value={String(deepfakeCount)}
        color="#EF9F27"
        delta={<DeltaLabel deltaPct={deepfakeDeltaPct} goodDirection="down" />}
      />
      <StatCard
        label="ACCURACY"
        value={`${accuracy}%`}
        color="#1D9E75"
        delta={<span className="text-[8px] text-text-muted">— stable</span>}
      />
      <StatCard
        label="AVG RESPONSE"
        // TODO: no real latency tracking exists yet (backend doesn't log
        // per-request timing) — wire this up once it does, rather than
        // showing a number that looks measured but isn't.
        value="—"
        color="#111111"
        delta={<span className="text-[8px] text-text-muted">not tracked yet</span>}
      />
    </div>
  );
}

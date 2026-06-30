interface DonutChartProps {
  phishingCount: number;
  deepfakeCount: number;
  otherCount: number;
}

const R = 28;
const CIRCUMFERENCE = 2 * Math.PI * R;

export default function DonutChart({ phishingCount, deepfakeCount, otherCount }: DonutChartProps) {
  const total = phishingCount + deepfakeCount + otherCount;
  const segments = [
    { label: "Phishing URL", value: phishingCount, color: "#E24B4A" },
    { label: "Deepfake", value: deepfakeCount, color: "#EF9F27" },
    // TODO: "other" lumps in safe scans + comms verifications — the
    // dashboard API doesn't expose a distinct comms-verification count, so
    // this isn't precise. Real numbers, imprecise label, not fabricated.
    { label: "Other / Comms", value: otherCount, color: "#1D9E75" },
  ];

  let offset = 0;
  const arcs = segments.map((seg) => {
    const fraction = total > 0 ? seg.value / total : 0;
    const length = fraction * CIRCUMFERENCE;
    const arc = { ...seg, length, offset };
    offset += length;
    return arc;
  });

  return (
    <div className="rounded-[10px] border border-hair border-border bg-card p-3">
      <p className="text-[11px] font-semibold text-text-primary">Threat type breakdown</p>

      <div className="mt-2 flex items-center gap-4">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <g transform="rotate(-90 40 40)">
            {arcs.map((arc) => (
              <circle
                key={arc.label}
                cx="40"
                cy="40"
                r={R}
                fill="none"
                stroke={arc.color}
                strokeWidth="12"
                strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
                strokeDashoffset={-arc.offset}
              />
            ))}
          </g>
          <text x="40" y="44" textAnchor="middle" fontSize="16" fontWeight="700" fill="#111111">
            {total}
          </text>
        </svg>

        <div className="space-y-1.5">
          {arcs.map((arc) => (
            <div key={arc.label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: arc.color }} />
              <span className="text-[9px] text-text-secondary">
                {arc.label} · {total > 0 ? Math.round((arc.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// TODO: backend doesn't capture request IP / geolocation anywhere yet, so
// there's no real per-country breakdown to show. This renders a clearly
// labeled placeholder shape rather than inventing real-looking numbers.
const SAMPLE_POINTS = [
  { cx: 245, cy: 45, r: 7, color: "#E24B4A", label: "IN · —" },
  { cx: 165, cy: 35, r: 5, color: "#EF9F27", label: "EU · —" },
  { cx: 265, cy: 38, r: 4, color: "#E24B4A", label: "CN · —" },
];

export default function OriginMap() {
  return (
    <div className="rounded-[10px] border border-hair border-border bg-card p-3">
      <p className="text-[11px] font-semibold text-text-primary">Threat origin map</p>
      <p className="text-[9px] text-text-muted">Top source countries</p>

      <svg viewBox="0 0 340 100" className="mt-2 w-full">
        <ellipse cx="80" cy="40" rx="55" ry="28" fill="#f0f0f0" stroke="#e0e0e0" />
        <ellipse cx="180" cy="35" rx="40" ry="24" fill="#f0f0f0" stroke="#e0e0e0" />
        <ellipse cx="260" cy="45" rx="50" ry="30" fill="#f0f0f0" stroke="#e0e0e0" />
        <ellipse cx="200" cy="75" rx="35" ry="18" fill="#f0f0f0" stroke="#e0e0e0" />

        {SAMPLE_POINTS.map((p) => (
          <g key={p.label}>
            <circle cx={p.cx} cy={p.cy} r={p.r + 6} fill={p.color} opacity={0.1} />
            <circle cx={p.cx} cy={p.cy} r={p.r} fill={p.color} />
            <text x={p.cx + p.r + 4} y={p.cy + 3} fontSize="8" fill="#888888">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-1 text-[8px] text-text-muted">Sample layout — country-level tracking not wired up yet</p>
    </div>
  );
}

// TODO: there's no API endpoint that aggregates SHAP importance across all
// scans (per-scan SHAP only comes back from a live /api/analyze/url call,
// never summarized). Feature names below are the real 24 features the
// model actually uses (see backend/ml/features.py) — the relative widths
// are illustrative placeholders, not computed from real data, until that
// aggregate endpoint exists.
const FEATURES = [
  { name: "domain_age_proxy", widthPct: 88, color: "#E24B4A" },
  { name: "subdomain_depth", widthPct: 72, color: "#E24B4A" },
  { name: "domain_entropy", widthPct: 55, color: "#EF9F27" },
  { name: "lookalike_score", widthPct: 42, color: "#EF9F27" },
  { name: "redirect_count", widthPct: 28, color: "#888888" },
];

export default function ShapFeatures() {
  return (
    <div className="rounded-[10px] border border-hair border-border bg-card p-3">
      <p className="text-[11px] font-semibold text-text-primary">Top SHAP features</p>
      <p className="text-[9px] text-text-muted">Avg across all scans</p>

      <div className="mt-2.5 space-y-2">
        {FEATURES.map((f) => (
          <div key={f.name} className="flex items-center gap-2">
            <span className="w-20 shrink-0 truncate font-mono text-[9px] text-text-secondary">{f.name}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-tint-gray">
              <div className="h-1.5 rounded-full" style={{ width: `${f.widthPct}%`, backgroundColor: f.color }} />
            </div>
            <span className="w-8 shrink-0 text-right text-[9px] text-text-muted">{f.widthPct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

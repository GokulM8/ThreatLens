export type ScanFilter = "all" | "url" | "email" | "media" | "comms" | "high" | "medium" | "safe";

const TYPE_FILTERS: { id: ScanFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "url", label: "URL" },
  { id: "email", label: "Email" },
  { id: "media", label: "Media" },
  { id: "comms", label: "Comms" },
];

const RISK_FILTERS: { id: ScanFilter; label: string; bg: string; border: string; color: string }[] = [
  { id: "high", label: "High risk", bg: "#fff0f0", border: "#fcc", color: "#E24B4A" },
  { id: "medium", label: "Medium", bg: "#fff8ed", border: "#fde8bc", color: "#EF9F27" },
  { id: "safe", label: "Safe", bg: "#f0faf5", border: "#1D9E7530", color: "#1D9E75" },
];

interface FilterBarProps {
  active: ScanFilter;
  onChange: (filter: ScanFilter) => void;
  onExport: () => void;
}

export default function FilterBar({ active, onChange, onExport }: FilterBarProps) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      {TYPE_FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className="rounded-pill border px-3 py-1 text-[10px]"
          style={{
            backgroundColor: active === f.id ? "#111111" : "#ffffff",
            borderColor: active === f.id ? "#111111" : "#eeeeee",
            color: active === f.id ? "#ffffff" : "#555555",
          }}
        >
          {f.label}
        </button>
      ))}
      {RISK_FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className="rounded-pill border px-3 py-1 text-[10px]"
          style={{
            backgroundColor: active === f.id ? f.bg : "#ffffff",
            borderColor: active === f.id ? f.border : "#eeeeee",
            color: active === f.id ? f.color : "#555555",
          }}
        >
          {f.label}
        </button>
      ))}

      <button onClick={onExport} className="ml-auto rounded-pill border border-hair border-border px-3 py-1 text-[10px] text-text-secondary">
        ↓ Export CSV
      </button>
    </div>
  );
}

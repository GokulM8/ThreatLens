export type Period = 7 | 30 | 90;

const OPTIONS: { id: Period; label: string }[] = [
  { id: 7, label: "7d" },
  { id: 30, label: "30d" },
  { id: 90, label: "90d" },
];

interface PeriodToggleProps {
  active: Period;
  onChange: (period: Period) => void;
}

export default function PeriodToggle({ active, onChange }: PeriodToggleProps) {
  return (
    <div className="flex items-center gap-1.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className="rounded-pill px-3 py-1 text-[10px]"
          style={{
            backgroundColor: active === opt.id ? "#111111" : "#ffffff",
            color: active === opt.id ? "#ffffff" : "#555555",
            border: active === opt.id ? "none" : "0.5px solid #eeeeee",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

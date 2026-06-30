import { TimelinePoint } from "@/lib/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CHART_HEIGHT = 70;

export default function DailyBarChart({ timeline }: { timeline: TimelinePoint[] }) {
  const last7 = timeline.slice(-7);
  const maxTotal = Math.max(...last7.map((d) => d.phishing_count + d.deepfake_count), 1);
  const barWidth = 28;
  const gap = 14;

  return (
    <div className="rounded-[10px] border border-hair border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-text-primary">Threats by day</p>
          <p className="text-[9px] text-text-muted">Last 7 days</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[9px] text-text-muted">
            <span className="h-2 w-2 rounded-sm bg-danger" /> Phishing
          </span>
          <span className="flex items-center gap-1 text-[9px] text-text-muted">
            <span className="h-2 w-2 rounded-sm bg-warning" /> Deepfake
          </span>
        </div>
      </div>

      <svg width="100%" height={CHART_HEIGHT + 20} viewBox={`0 0 ${last7.length * (barWidth + gap)} ${CHART_HEIGHT + 20}`}>
        {last7.map((day, i) => {
          const x = i * (barWidth + gap) + gap / 2;
          const phishingH = (day.phishing_count / maxTotal) * CHART_HEIGHT;
          const deepfakeH = (day.deepfake_count / maxTotal) * CHART_HEIGHT;
          const dayLabel = DAY_LABELS[new Date(day.date).getUTCDay()];
          return (
            <g key={day.date}>
              <rect
                x={x}
                y={CHART_HEIGHT - phishingH - deepfakeH + 4}
                width={barWidth}
                height={deepfakeH}
                fill="#EF9F27"
                rx="2"
              />
              <rect x={x} y={CHART_HEIGHT - phishingH + 4} width={barWidth} height={phishingH} fill="#E24B4A" rx="2" />
              <text x={x + barWidth / 2} y={CHART_HEIGHT + 16} textAnchor="middle" fontSize="8" fill="#aaaaaa">
                {dayLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Dot,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { WeekPoint } from "@/lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]}`;
}

function placeholderData(): WeekPoint[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return { date: d.toISOString().slice(0, 10), thisWeek: 0, priorWeek: 0 };
  });
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const thisWeek = payload.find((p: any) => p.dataKey === "thisWeek")?.value ?? 0;
  const priorWeek = payload.find((p: any) => p.dataKey === "priorWeek")?.value ?? 0;
  return (
    <div className="rounded-btn px-3 py-2 text-2xs text-white" style={{ backgroundColor: "#111111" }}>
      <p className="mb-1 text-[#aaaaaa]">{shortDate(label)}</p>
      <p style={{ color: "#E24B4A" }}>This week: {thisWeek}</p>
      <p style={{ color: "#888888" }}>Prior week: {priorWeek}</p>
    </div>
  );
}

function PeakDot(props: any) {
  const { cx, cy, value, data } = props;
  const maxValue = Math.max(...data.map((d: WeekPoint) => d.thisWeek));
  if (value !== maxValue || maxValue === 0) return null;
  return <Dot cx={cx} cy={cy} r={3.5} fill="#ffffff" stroke="#E24B4A" strokeWidth={2} />;
}

export default function ThreatChart({ data }: { data: WeekPoint[] }) {
  const chartData = data.length > 0 ? data : placeholderData();
  const thisWeekTotal = chartData.reduce((acc, d) => acc + d.thisWeek, 0);
  const maxValue = Math.max(...chartData.map((d) => Math.max(d.thisWeek, d.priorWeek)), 1);
  const gridTicks = [maxValue * 0.25, maxValue * 0.5, maxValue * 0.75];

  return (
    <div className="h-full rounded-card border border-hair border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-section text-text-primary">Threat timeline</p>
          <p className="mt-0.5 text-xs text-text-muted">Last 7 days vs prior week</p>
        </div>
        <span className="rounded-pill bg-[#111111] px-2.5 py-1 text-[10px] font-semibold text-white">
          This week · {thisWeekTotal}
        </span>
      </div>

      <div className="mt-3" style={{ height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="thisWeekFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E24B4A" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#E24B4A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={[0, maxValue]} ticks={gridTicks} />
            <CartesianGrid vertical={false} stroke="#f0f0f0" strokeWidth={0.5} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fontSize: 10, fill: "#bbbbbb" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="thisWeek"
              stroke="#E24B4A"
              strokeWidth={2}
              fill="url(#thisWeekFill)"
              dot={(props: any) => {
                const { key, ...rest } = props;
                return <PeakDot key={key ?? rest.index} {...rest} data={chartData} />;
              }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="priorWeek"
              stroke="#cccccc"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

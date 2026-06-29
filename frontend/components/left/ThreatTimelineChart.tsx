"use client";

import {
  Area,
  AreaChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import CardLabel from "../ui/CardLabel";
import { TimelinePoint } from "@/lib/types";

function EndDot(props: { cx?: number; cy?: number; index?: number; dataLength: number }) {
  const { cx, cy, index, dataLength } = props;
  if (index !== dataLength - 1 || cx === undefined || cy === undefined) return null;
  return <circle cx={cx} cy={cy} r={3} fill="#1D9E75" />;
}

export default function ThreatTimelineChart({ data }: { data: TimelinePoint[] }) {
  const hasData = data.length > 0;

  return (
    <div
      className="border border-hair border-border bg-surface p-3"
      style={{ borderRadius: 10, height: 94 }}
    >
      <CardLabel>Threat Timeline · 7D</CardLabel>
      <div style={{ height: 60 }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1D9E75" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#1D9E75" stopOpacity={0} />
                </linearGradient>
              </defs>
              <ReferenceLine x={data[Math.max(data.length - 2, 0)]?.date} stroke="#0e1820" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="phishing_count"
                stroke="#1D9E75"
                strokeWidth={1.5}
                fill="url(#timelineFill)"
                dot={(props) => <EndDot key={props.index} {...props} dataLength={data.length} />}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="deepfake_count"
                stroke="#E24B4A"
                strokeOpacity={0.3}
                strokeWidth={1.2}
                strokeDasharray="4 3"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-text-muted">
            No timeline data yet
          </div>
        )}
      </div>
    </div>
  );
}

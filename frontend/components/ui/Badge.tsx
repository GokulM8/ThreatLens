import { ReactNode } from "react";

export type BadgeTone = "danger" | "warning" | "accent" | "gray";

const TONE_STYLES: Record<BadgeTone, { bg: string; color: string }> = {
  danger: { bg: "#fff0f0", color: "#E24B4A" },
  warning: { bg: "#fff8ed", color: "#EF9F27" },
  accent: { bg: "#f0faf5", color: "#1D9E75" },
  gray: { bg: "#f5f5f5", color: "#555555" },
};

interface BadgeProps {
  tone: BadgeTone;
  children: ReactNode;
  className?: string;
}

export default function Badge({ tone, children, className = "" }: BadgeProps) {
  const { bg, color } = TONE_STYLES[tone];
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-1 text-2xs font-semibold ${className}`}
      style={{ backgroundColor: bg, color }}
    >
      {children}
    </span>
  );
}

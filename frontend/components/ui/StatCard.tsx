import { MoreHorizontal } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: string | number;
  valueColor: string;
  label: string;
}

export default function StatCard({ icon: Icon, iconBg, iconColor, value, valueColor, label }: StatCardProps) {
  return (
    <div className="rounded-card border border-hair border-border bg-card p-3.5">
      <div className="flex items-start justify-between">
        <div className="flex h-7 w-7 items-center justify-center rounded-btn" style={{ backgroundColor: iconBg }}>
          <Icon size={14} color={iconColor} strokeWidth={2} />
        </div>
        <MoreHorizontal size={14} className="text-[#cccccc]" />
      </div>
      <p className="mt-3 text-hero" style={{ color: valueColor }}>
        {value}
      </p>
      <p className="mt-0.5 text-sm leading-snug text-text-muted">{label}</p>
    </div>
  );
}

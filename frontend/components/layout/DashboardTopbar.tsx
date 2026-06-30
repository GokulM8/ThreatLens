import { useEffect, useState } from "react";
import { Bell, ChevronLeft, ChevronRight, Settings } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Manual, locale-independent formatting (no Intl/toLocaleString): the
// server's bundled ICU and the browser's ICU can render the same Intl
// options as different literal strings, which trips a hydration mismatch.
function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

interface TopbarProps {
  greetingName: string;
  newThreatsCount: number;
  highRiskCount: number;
}

function timeOfDayGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardTopbar({ greetingName, newThreatsCount, highRiskCount }: TopbarProps) {
  // Computed client-side only (component is rendered under "use client" /
  // not statically prerendered with real data anyway, since stats come from
  // SWR) — safe to read the real local hour here.
  const [greeting, setGreeting] = useState("Good morning");
  useEffect(() => {
    setGreeting(timeOfDayGreeting(new Date().getHours()));
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-5">
      <div>
        <h1 className="text-greeting text-text-primary">
          {greeting}, {greetingName}!
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {newThreatsCount} new threat{newThreatsCount === 1 ? "" : "s"} detected since your last scan ·{" "}
          {formatDate(new Date())}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center overflow-hidden rounded-btn border border-hair border-border">
          <button disabled className="flex h-8 w-8 items-center justify-center text-text-muted disabled:opacity-50">
            <ChevronLeft size={15} />
          </button>
          <div className="h-4 w-px bg-border" />
          <button disabled className="flex h-8 w-8 items-center justify-center text-text-muted disabled:opacity-50">
            <ChevronRight size={15} />
          </button>
        </div>

        <button className="relative flex h-8 w-8 items-center justify-center rounded-full border border-hair border-border text-text-secondary">
          <Bell size={15} />
          {highRiskCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[8px] font-semibold text-white">
              {highRiskCount > 99 ? "99+" : highRiskCount}
            </span>
          )}
        </button>

        <button className="flex h-8 w-8 items-center justify-center rounded-full border border-hair border-border text-text-secondary">
          <Settings size={15} />
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] text-[11px] font-semibold text-white">
          GM
        </div>
      </div>
    </header>
  );
}

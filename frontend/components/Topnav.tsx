"use client";

import { useState } from "react";
import { Bell, FileText, Home, Image as ImageIcon, Link2, PanelRight, ShieldCheck, Sparkles } from "lucide-react";
import Toggle from "./ui/Toggle";

export type ScanMode = "overview" | "url" | "content" | "media" | "verify";

const TABS: { id: ScanMode; icon: typeof Home }[] = [
  { id: "overview", icon: Home },
  { id: "url", icon: Link2 },
  { id: "content", icon: FileText },
  { id: "media", icon: ImageIcon },
  { id: "verify", icon: ShieldCheck },
];

interface TopnavProps {
  activeTab: ScanMode;
  onTabChange: (tab: ScanMode) => void;
}

export default function Topnav({ activeTab, onTabChange }: TopnavProps) {
  const [premiumOn, setPremiumOn] = useState(true);

  return (
    <header className="flex items-center justify-between border-b border-hair border-border bg-bg-secondary px-5 py-2.5">
      <div className="flex items-center gap-3">
        <Sparkles size={20} className="text-accent" strokeWidth={2} />
        <nav className="flex items-center gap-1 rounded-pill border border-hair border-border bg-surface p-1">
          {TABS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full transition-colors"
              style={{
                backgroundColor: activeTab === id ? "#1D9E75" : "transparent",
                color: activeTab === id ? "#ffffff" : "#2a5048",
              }}
            >
              <Icon size={16} strokeWidth={2} />
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2 rounded-pill border border-hair border-border bg-surface px-3 py-1.5">
        <Sparkles size={13} className="text-accent" />
        <button onClick={() => setPremiumOn((v) => !v)}>
          <Toggle on={premiumOn} />
        </button>
        <span className="text-xs text-text-secondary">Premium Analyst</span>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-text-secondary">
          <Bell size={15} />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-text-secondary">
          <PanelRight size={15} />
        </button>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-2xs font-semibold"
          style={{ backgroundColor: "#041a14", border: "1.5px solid #1D9E75", color: "#1D9E75" }}
        >
          GM
        </div>
      </div>
    </header>
  );
}

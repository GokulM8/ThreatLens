"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ExternalLink,
  LogOut,
  Settings,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { ActiveThreat } from "@/lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const READ_KEY = "threatlens:read-threats";

function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function timeOfDayGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface TopbarProps {
  greetingName: string;
  newThreatsCount: number;
  highRiskCount: number;
  activeThreats: ActiveThreat[];
}

export default function DashboardTopbar({ greetingName, newThreatsCount, highRiskCount, activeThreats }: TopbarProps) {
  const router = useRouter();
  const [greeting, setGreeting] = useState("Good morning");
  const [bellOpen, setBellOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const bellRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGreeting(timeOfDayGreeting(new Date().getHours()));
    try {
      const stored = JSON.parse(window.localStorage.getItem(READ_KEY) ?? "[]");
      setReadIds(new Set(stored));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  // Close all dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function persistReadIds(next: Set<string>) {
    setReadIds(next);
    window.localStorage.setItem(READ_KEY, JSON.stringify([...next]));
  }

  function markRead(id: string) {
    persistReadIds(new Set([...readIds, id]));
  }

  function markAllRead() {
    persistReadIds(new Set([...readIds, ...activeThreats.map((t) => t.id)]));
  }

  function clearAll() {
    persistReadIds(new Set([...readIds, ...activeThreats.map((t) => t.id)]));
    setBellOpen(false);
  }

  const unread = activeThreats.filter((t) => !readIds.has(t.id));
  const unreadCount = unread.length;

  function openDropdown(which: "bell" | "settings" | "profile") {
    setBellOpen(which === "bell" ? (v) => !v : false);
    setSettingsOpen(which === "settings" ? (v) => !v : false);
    setProfileOpen(which === "profile" ? (v) => !v : false);
  }

  function handleSignOut() {
    window.localStorage.removeItem("threatlens:last-scan");
    window.localStorage.removeItem("threatlens:demo-scan");
    router.push("/");
  }

  function handleClearCache() {
    window.localStorage.removeItem("threatlens:last-scan");
    setSettingsOpen(false);
    window.location.reload();
  }

  return (
    <header className="flex items-center justify-between px-6 py-3">
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
        {/* Bell — notifications dropdown */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => openDropdown("bell")}
            className={`relative flex h-8 w-8 items-center justify-center rounded-full border border-hair transition-colors ${bellOpen ? "border-danger bg-tint-danger text-danger" : "border-border text-text-secondary hover:border-danger hover:text-danger"}`}
            title="Notifications"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[8px] font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-card border border-hair border-border bg-card shadow-scanner">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <p className="text-xs font-semibold text-text-primary">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-danger px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </p>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[10px] text-accent hover:text-accent/80"
                  >
                    <CheckCheck size={11} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-60 overflow-y-auto">
                {unread.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-8">
                    <CheckCheck size={20} className="text-accent opacity-40" />
                    <p className="text-[11px] text-text-muted">No new notifications</p>
                  </div>
                ) : (
                  unread.map((threat) => (
                    <div
                      key={threat.id}
                      className="flex items-start gap-2.5 border-b border-[#f8f8f8] px-3 py-2.5 last:border-0"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-tint-danger text-[9px] font-bold text-danger">
                        <ShieldAlert size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-text-primary">{threat.subtext}</p>
                        <p className="mt-0.5 text-[10px] capitalize text-text-muted">{threat.threat_type} · {threat.verdict}</p>
                      </div>
                      <button
                        onClick={() => markRead(threat.id)}
                        title="Mark as read"
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:bg-tint-danger hover:text-danger"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border px-3 py-2">
                <Link
                  href="/history?filter=high"
                  onClick={() => setBellOpen(false)}
                  className="text-[10px] text-accent hover:underline"
                >
                  View all in History →
                </Link>
                {activeThreats.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 text-[10px] text-text-muted transition-colors hover:text-danger"
                  >
                    <Trash2 size={11} />
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings dropdown */}
        <div ref={settingsRef} className="relative">
          <button
            onClick={() => openDropdown("settings")}
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-hair border-border transition-colors ${settingsOpen ? "border-accent bg-tint-success text-accent" : "text-text-secondary hover:border-accent hover:text-accent"}`}
            title="Settings"
          >
            <Settings size={15} />
          </button>

          {settingsOpen && (
            <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-card border border-hair border-border bg-card shadow-scanner">
              <div className="border-b border-border px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[1px] text-text-muted">Settings</p>
              </div>
              <button
                onClick={handleClearCache}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-text-secondary transition-colors hover:bg-tint-gray hover:text-danger"
              >
                <Trash2 size={13} />
                Clear last scan cache
              </button>
              <a
                href={`${API_URL}/docs`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setSettingsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-secondary transition-colors hover:bg-tint-gray hover:text-text-primary"
              >
                <ExternalLink size={13} />
                API documentation
              </a>
              <button
                onClick={() => setSettingsOpen(false)}
                className="flex w-full items-center gap-2.5 border-t border-border px-3 py-2.5 text-xs text-text-muted transition-colors hover:bg-tint-gray"
              >
                <X size={13} />
                Close
              </button>
            </div>
          )}
        </div>

        {/* Avatar / profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => openDropdown("profile")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] text-[11px] font-semibold text-white transition-opacity hover:opacity-80"
            title="Profile"
          >
            GM
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-card border border-hair border-border bg-card shadow-scanner">
              <div className="border-b border-border px-3 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[11px] font-semibold text-white">
                    GM
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary">{greetingName} M.</p>
                    <p className="text-[10px] text-text-muted">Premium Analyst</p>
                  </div>
                </div>
              </div>
              <Link
                href="/insights"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-secondary transition-colors hover:bg-tint-gray hover:text-text-primary"
              >
                My insights →
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 border-t border-border px-3 py-2.5 text-xs text-danger transition-colors hover:bg-tint-danger"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

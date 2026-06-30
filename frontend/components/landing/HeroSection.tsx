"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ScanLine } from "lucide-react";
import useSWR from "swr";
import { analyzeURL, getDashboardStats, toLastScanResult } from "@/lib/api";
import { LastScanResult } from "@/lib/types";
import { AuroraBlob, ScannerWaveBars, useCountUp } from "../ui/animations";
import ScannerTerminal from "../ui/ScannerTerminal";

const LEVEL_COLOR: Record<LastScanResult["level"], string> = {
  high: "#E24B4A",
  medium: "#EF9F27",
  safe: "#1D9E75",
};

function StatCell({ label, value, color, start }: { label: string; value: number; color: string; start: boolean }) {
  const count = useCountUp(value, 1400, start);
  return (
    <div className="flex-1 px-4 py-4 text-center">
      <p className="text-hero-lg" style={{ color }}>
        {count.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-text-muted">{label}</p>
    </div>
  );
}

export default function HeroSection() {
  const { data: stats } = useSWR("dashboard-stats-hero", getDashboardStats);
  const [statsVisible, setStatsVisible] = useState(false);

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LastScanResult | null>(null);

  useEffect(() => {
    if (stats) setStatsVisible(true);
  }, [stats]);

  async function handleScan() {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeURL(url.trim());
      setResult(toLastScanResult("url", res.url, res));
    } catch {
      // landing demo: a failed scan just resets silently, full error handling lives on /analyze
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 text-center">
      <AuroraBlob color="rgba(29,158,117,0.25)" className="-top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2" />
      <AuroraBlob color="rgba(226,75,74,0.15)" className="bottom-0 right-0 h-[400px] w-[400px]" />

      <h1 className="relative max-w-3xl text-landing-hero">
        <span className="block text-text-primary">Stop threats before</span>
        <span
          className="block animate-shimmer bg-gradient-to-r from-accent via-[#0f6e56] to-accent bg-[length:200%_auto] bg-clip-text text-transparent"
        >
          they reach investors
        </span>
      </h1>

      <p className="relative mt-5 max-w-xl text-[17px] font-light text-[#888888]">
        Real-time phishing, deepfake, and fake-communication detection for India&apos;s securities markets — hybrid
        ML + rules, with SHAP explanations for every verdict.
      </p>

      <div className="relative mt-8 flex items-center gap-3">
        <Link href="/analyze" className="rounded-cta bg-scan-card px-6 py-3 text-sm font-bold text-white">
          Get started →
        </Link>
        <Link
          href="/dashboard"
          className="rounded-cta border border-hair border-border bg-white px-6 py-3 text-sm font-bold text-text-primary"
        >
          View dashboard
        </Link>
      </div>

      <div className="relative mt-12 w-full max-w-xl">
        <ScannerTerminal>
          <div className="flex items-center gap-3">
            <ScanLine size={16} className="shrink-0 text-text-muted" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="Paste a URL to scan it for real, right now…"
              className="w-full bg-transparent font-mono text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
          <div className="my-3 h-px bg-border" />
          <div className="flex items-center justify-between">
            {loading ? (
              <ScannerWaveBars />
            ) : result ? (
              <span
                className="rounded-pill px-2.5 py-1 text-xs font-bold"
                style={{ backgroundColor: "#f5f5f5", color: LEVEL_COLOR[result.level] }}
              >
                {Math.round(result.riskScore)}/100 · {result.verdict}
              </span>
            ) : (
              <span className="text-2xs text-text-muted">Ready to scan</span>
            )}
            <button
              onClick={handleScan}
              disabled={loading || !url.trim()}
              className="flex items-center justify-center gap-2 rounded-btn bg-[#111111] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Scan
            </button>
          </div>
        </ScannerTerminal>
      </div>

      <div className="relative mt-10 flex w-full max-w-2xl divide-x divide-border rounded-feature border border-hair border-border bg-card">
        <StatCell label="Phishing blocked" value={stats?.phishing_count ?? 0} color="#E24B4A" start={statsVisible} />
        <StatCell label="Deepfakes flagged" value={stats?.deepfake_count ?? 0} color="#EF9F27" start={statsVisible} />
        <StatCell label="Accuracy" value={stats?.accuracy ?? 0} color="#1D9E75" start={statsVisible} />
        <StatCell label="Total scans" value={stats?.total_scans ?? 0} color="#111111" start={statsVisible} />
      </div>
    </section>
  );
}

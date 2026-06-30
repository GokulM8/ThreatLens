"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { analyzeURL, toLastScanResult } from "@/lib/api";
import { LastScanResult } from "@/lib/types";

// A representative typosquat-style URL, scanned live against the real
// backend — this panel renders whatever score/SHAP values come back for
// real, not a hardcoded "87". Cached in localStorage so repeat visits
// (the dev server's React Strict Mode double-mount included) don't write a
// fresh row to the live scans table on every single page load.
const DEMO_URL = "http://zerodha-secure-kyc.tk/verify-account";
const CACHE_KEY = "threatlens:demo-scan";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Module-level (not component state) so React 18 Strict Mode's dev-only
// double-invoked effect can't fire the request twice before the first
// response has a chance to populate the localStorage cache.
let inFlight: Promise<LastScanResult> | null = null;

function shapBarColor(value: number): string {
  if (value > 0.15) return "#E24B4A";
  if (value > 0) return "#EF9F27";
  return "#777777";
}

export default function DemoSection() {
  const [result, setResult] = useState<LastScanResult | null>(null);
  const [barsIn, setBarsIn] = useState(false);

  useEffect(() => {
    const cached = window.localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { result: cachedResult, scannedAt } = JSON.parse(cached);
        if (Date.now() - scannedAt < CACHE_TTL_MS) {
          setResult(cachedResult);
          return;
        }
      } catch {
        window.localStorage.removeItem(CACHE_KEY);
      }
    }

    if (!inFlight) {
      inFlight = analyzeURL(DEMO_URL).then((res) => {
        const mapped = toLastScanResult("url", res.url, res);
        window.localStorage.setItem(CACHE_KEY, JSON.stringify({ result: mapped, scannedAt: Date.now() }));
        return mapped;
      });
    }

    inFlight.then(setResult).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setBarsIn(true), 50);
    return () => clearTimeout(t);
  }, [result]);

  const shapRows = result?.shap.slice(0, 4) ?? [];
  const maxAbs = Math.max(...shapRows.map((r) => Math.abs(r.shap_value)), 0.0001);

  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="relative overflow-hidden rounded-demo bg-scan-card p-10">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(29,158,117,0.18), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(226,75,74,0.15), transparent 70%)" }}
        />

        <div className="relative grid gap-10 sm:grid-cols-2">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center rounded-pill bg-white/10 px-3 py-1 text-2xs font-semibold uppercase tracking-[1px] text-white">
              Live demo
            </span>
            <h2 className="mt-4 text-landing-section text-white">Real ML. Real scores. No mocks.</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#aaaaaa]">
              Every number on this page — including the panel to the right — comes from a live call to the same
              FastAPI backend that powers the dashboard. No canned demo data.
            </p>
            <Link
              href="/analyze"
              className="mt-6 w-fit rounded-cta bg-accent px-6 py-3 text-sm font-bold text-white"
            >
              Try it yourself →
            </Link>
          </div>

          <div
            className="rounded-feature p-5"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}
          >
            {!result ? (
              <p className="text-sm text-[#777777]">Scanning {DEMO_URL}…</p>
            ) : (
              <>
                <p className="text-2xs uppercase tracking-[1.5px] text-[#777777]">Scan result</p>
                <p className="mt-1 max-w-[280px] truncate font-mono text-xs text-[#777777]">{result.subject}</p>
                <p className="mt-3 text-hero-lg leading-none" style={{ color: "#E24B4A" }}>
                  {Math.round(result.riskScore)}
                </p>
                <p className="mt-1 text-xs text-[#777777]">score/100 · {result.verdict}</p>

                <div className="mt-4 space-y-2">
                  {shapRows.map((row) => {
                    const color = shapBarColor(row.shap_value);
                    const widthPct = barsIn ? (Math.abs(row.shap_value) / maxAbs) * 100 : 0;
                    return (
                      <div key={row.feature} className="flex items-center gap-2">
                        <span className="w-20 shrink-0 truncate text-2xs text-[#999999]">{row.feature}</span>
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-1 rounded-full transition-all duration-700"
                            style={{ width: `${widthPct}%`, backgroundColor: color }}
                          />
                        </div>
                        <span className="w-10 shrink-0 text-right text-2xs font-medium" style={{ color }}>
                          {row.shap_value > 0 ? "+" : ""}
                          {row.shap_value.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {result.firedRules.slice(0, 3).map((rule) => (
                    <span
                      key={rule.name}
                      className="rounded-pill px-2 py-1 text-2xs font-medium"
                      style={{ backgroundColor: "#2a0808", color: "#E24B4A", border: "0.5px solid #4a1010" }}
                    >
                      {rule.name}
                    </span>
                  ))}
                </div>

                <Link
                  href="/analyze"
                  className="mt-4 flex w-full items-center justify-center rounded-btn bg-white py-2 text-sm font-bold text-[#111111]"
                >
                  Analyze deeper →
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { analyzeURL, toLastScanResult } from "@/lib/api";
import { LastScanResult } from "@/lib/types";
import ResultCard from "./ResultCard";
import ScannerTerminal from "./ScannerTerminal";
import { ScannerWaveBars } from "../ui/animations";
import { LogoIcon } from "../ui/Logo";

interface URLTabProps {
  value: string;
  onValueChange: (value: string) => void;
  result: LastScanResult | null;
  onResult: (result: LastScanResult) => void;
}

const LEVEL_COLOR: Record<LastScanResult["level"], string> = {
  high: "#E24B4A",
  medium: "#EF9F27",
  safe: "#1D9E75",
};

export default function URLTab({ value, onValueChange, result, onResult }: URLTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeURL(value.trim());
      onResult(toLastScanResult("url", res.url, res));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <ScannerTerminal>
        <span className="shrink-0 opacity-40">
          <LogoIcon size={14} mode="light" />
        </span>
        <input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleScan()}
          placeholder="paste a URL to scan..."
          className="min-w-0 flex-1 bg-transparent font-mono text-xs text-text-primary outline-none placeholder:text-text-muted"
        />
        <div className="h-[22px] w-px shrink-0 bg-border" />
        <div className="shrink-0">
          {loading ? (
            <ScannerWaveBars />
          ) : result ? (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: "#f5f5f5", color: LEVEL_COLOR[result.level] }}
            >
              {Math.round(result.riskScore)}
            </span>
          ) : null}
        </div>
        <button
          onClick={handleScan}
          disabled={loading || !value.trim()}
          className="shrink-0 rounded-md bg-[#111111] px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
        >
          Scan
        </button>
      </ScannerTerminal>

      {error && <p className="mt-2 text-[10px] text-danger">{error}</p>}

      {result && (
        <div className="mt-3">
          <ResultCard result={result} />
        </div>
      )}
    </div>
  );
}

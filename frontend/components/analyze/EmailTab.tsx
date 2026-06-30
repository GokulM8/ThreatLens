"use client";

import { useState } from "react";
import { analyzeContent, toLastScanResult } from "@/lib/api";
import { LastScanResult } from "@/lib/types";
import ResultCard from "./ResultCard";

export default function EmailTab({ onScanned }: { onScanned: (result: LastScanResult) => void }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<LastScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeContent(text.trim());
      const mapped = toLastScanResult("content", text.trim().slice(0, 60), res);
      setResult(mapped);
      onScanned(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste email content or headers to analyze..."
        className="min-h-[120px] w-full resize-none rounded-btn border border-hair border-border bg-[#f8f8f8] p-3 font-mono text-xs text-text-primary outline-none placeholder:text-text-muted"
      />
      <button
        onClick={handleScan}
        disabled={loading || !text.trim()}
        className="mt-2 w-full rounded-btn bg-[#111111] py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {loading ? "Scanning…" : "Scan"}
      </button>

      {error && <p className="mt-2 text-[10px] text-danger">{error}</p>}

      <div className="mt-3">
        <ResultCard result={result} placeholder="Paste email content above to scan" />
      </div>
    </div>
  );
}

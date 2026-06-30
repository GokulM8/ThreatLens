"use client";

import { useRef, useState } from "react";
import { Film, Paperclip } from "lucide-react";
import { analyzeMedia, toLastScanResult } from "@/lib/api";
import { LastScanResult } from "@/lib/types";
import ResultCard from "./ResultCard";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaTab({ onScanned }: { onScanned: (result: LastScanResult) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<LastScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeMedia(file);
      const mapped = toLastScanResult("media", file.name, res);
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
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) setFile(dropped);
        }}
        className="cursor-pointer rounded-card border-[1.5px] border-dashed bg-[#f8f8f8] p-8 text-center transition-colors"
        style={{ borderColor: dragOver ? "#1D9E75" : "#dddddd" }}
      >
        <Film size={24} className="mx-auto text-text-muted" />
        <p className="mt-2 text-sm text-text-muted">Drop a video or image file</p>
        <p className="mt-0.5 text-xs text-[#cccccc]">or click to browse</p>
        <p className="mt-2 text-[9px] text-[#cccccc]">MP4, MOV, JPG, PNG — max 50MB</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      {file && (
        <div className="mt-2 flex items-center gap-2 rounded-btn border border-hair border-border bg-card px-3 py-2">
          <Paperclip size={12} className="shrink-0 text-text-muted" />
          <span className="flex-1 truncate text-xs text-text-primary">{file.name}</span>
          <span className="shrink-0 rounded-full bg-tint-gray px-2 py-0.5 text-[9px] text-text-secondary">
            {formatBytes(file.size)} · {file.type || "unknown"}
          </span>
        </div>
      )}

      <button
        onClick={handleScan}
        disabled={loading || !file}
        className="mt-2 w-full rounded-btn bg-[#111111] py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {loading ? "Analyzing…" : "Analyze"}
      </button>

      {error && <p className="mt-2 text-[10px] text-danger">{error}</p>}

      <div className="mt-3">
        <ResultCard result={result} placeholder="Upload a file above to scan" />
      </div>
    </div>
  );
}

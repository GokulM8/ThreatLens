"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { analyzeContent, analyzeMedia, analyzeUrl, verifyCommunication } from "@/lib/api";
import { ContentAnalysisResult, MediaAnalysisResult, UrlAnalysisResult, CommunicationVerifyResult } from "@/lib/types";
import Button from "./ui/Button";
import { ScanMode } from "./Topnav";

interface ScanModalProps {
  initialTab: ScanMode;
  onClose: () => void;
  onUrlResult: (result: UrlAnalysisResult) => void;
  onAnyResult: () => void;
}

const TABS: { id: Exclude<ScanMode, "overview">; label: string }[] = [
  { id: "url", label: "URL" },
  { id: "content", label: "Email / Text" },
  { id: "media", label: "Media" },
  { id: "verify", label: "Verify" },
];

export default function ScanModal({ initialTab, onClose, onUrlResult, onAnyResult }: ScanModalProps) {
  const [tab, setTab] = useState<Exclude<ScanMode, "overview">>(
    initialTab === "overview" ? "url" : initialTab
  );
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [urlResult, setUrlResult] = useState<UrlAnalysisResult | null>(null);
  const [contentResult, setContentResult] = useState<ContentAnalysisResult | null>(null);
  const [mediaResult, setMediaResult] = useState<MediaAnalysisResult | null>(null);
  const [verifyResult, setVerifyResult] = useState<CommunicationVerifyResult | null>(null);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      if (tab === "url") {
        if (!url.trim()) return;
        const result = await analyzeUrl(url.trim());
        setUrlResult(result);
        onUrlResult(result);
      } else if (tab === "content") {
        if (!text.trim()) return;
        setContentResult(await analyzeContent(text.trim()));
      } else if (tab === "media") {
        if (!file) return;
        setMediaResult(await analyzeMedia(file));
      } else if (tab === "verify") {
        if (!text.trim()) return;
        setVerifyResult(await verifyCommunication(text.trim()));
      }
      onAnyResult();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-md rounded-card border border-hair border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">New Scan</h3>
          <button onClick={onClose} className="text-text-secondary">
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 flex gap-1 rounded-pill border border-hair border-border bg-surface-inner p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 rounded-full px-2 py-1.5 text-2xs font-medium transition-colors"
              style={{
                backgroundColor: tab === t.id ? "#1D9E75" : "transparent",
                color: tab === t.id ? "#ffffff" : "#2a5048",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === "url" && (
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="https://example.com/login"
              className="w-full rounded-btn border border-hair border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            />
          )}
          {tab === "content" && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Paste the email or message text here..."
              className="w-full rounded-btn border border-hair border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
            />
          )}
          {tab === "media" && (
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-btn border border-hair border-border bg-bg px-3 py-2 text-sm text-text-secondary"
            />
          )}
          {tab === "verify" && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Paste the official SEBI/exchange communication text..."
              className="w-full rounded-btn border border-hair border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
            />
          )}

          <Button variant="primary" className="mt-3 w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze"}
          </Button>
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        </div>

        {tab === "url" && urlResult && (
          <p className="mt-3 text-xs text-text-secondary">
            Verdict: <span className="font-semibold text-text-primary">{urlResult.verdict}</span> · risk{" "}
            {urlResult.risk_score}
          </p>
        )}
        {tab === "content" && contentResult && (
          <p className="mt-3 text-xs text-text-secondary">
            Verdict: <span className="font-semibold text-text-primary">{contentResult.verdict}</span> · risk{" "}
            {contentResult.risk_score}
          </p>
        )}
        {tab === "media" && mediaResult && (
          <p className="mt-3 text-xs text-text-secondary">
            Verdict: <span className="font-semibold text-text-primary">{mediaResult.verdict}</span>
          </p>
        )}
        {tab === "verify" && verifyResult && (
          <p className="mt-3 text-xs text-text-secondary">
            {verifyResult.verified
              ? `Verified — matches ${verifyResult.source}`
              : verifyResult.note ?? "No match found in registry"}
          </p>
        )}
      </div>
    </div>
  );
}

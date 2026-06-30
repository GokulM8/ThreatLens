"use client";

import { useRef, useState } from "react";
import { Check, Paperclip, X } from "lucide-react";
import { verifyCommunication, verifyCommunicationFile } from "@/lib/api";
import { CommunicationVerifyResult } from "@/lib/types";

export default function CommTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CommunicationVerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    if (!text.trim() && !file) return;
    setLoading(true);
    setError(null);
    try {
      const res = file ? await verifyCommunicationFile(file) : await verifyCommunication(text.trim());
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (e.target.value) setFile(null);
        }}
        placeholder="Paste official communication text..."
        className="min-h-[120px] w-full resize-none rounded-btn border border-hair border-border bg-[#f8f8f8] p-3 font-mono text-xs text-text-primary outline-none placeholder:text-text-muted"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        className="mt-2 flex h-[60px] cursor-pointer items-center justify-center gap-2 rounded-btn border border-hair border-border bg-card text-text-muted"
      >
        <Paperclip size={13} />
        <span className="text-xs">{file ? file.name : "or upload PDF"}</span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          if (e.target.files?.[0]) setText("");
        }}
      />

      <button
        onClick={handleVerify}
        disabled={loading || (!text.trim() && !file)}
        className="mt-2 w-full rounded-btn bg-[#111111] py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {loading ? "Verifying…" : "Verify"}
      </button>

      {error && <p className="mt-2 text-[10px] text-danger">{error}</p>}

      {result && (
        <div
          className="mt-3 rounded-card p-3.5"
          style={{
            backgroundColor: result.verified ? "#f0faf5" : "#fff0f0",
            border: result.verified ? "0.5px solid #1D9E7540" : "0.5px solid #ffd5d5",
            borderTop: result.verified ? "2px solid #1D9E75" : "2px solid #E24B4A",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: result.verified ? "#1D9E75" : "#E24B4A" }}
            >
              {result.verified ? <Check size={16} color="white" /> : <X size={16} color="white" />}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: result.verified ? "#1D9E75" : "#E24B4A" }}>
                {result.verified ? "Verified — Authentic communication" : "Unverified"}
              </p>
              {result.verified ? (
                <>
                  <p className="mt-1 text-xs text-text-secondary">
                    Source confirmed via registry{result.source ? ` · ${result.source}` : ""}
                  </p>
                  <span className="mt-2 inline-block rounded-[5px] bg-white px-2 py-1 font-mono text-[9px] text-text-muted">
                    Hash: {result.hash.slice(0, 16)}…
                  </span>
                </>
              ) : (
                <>
                  <p className="mt-1 text-xs text-text-secondary">No registry match</p>
                  <p className="mt-1 text-xs font-semibold text-danger">Do not act on this</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

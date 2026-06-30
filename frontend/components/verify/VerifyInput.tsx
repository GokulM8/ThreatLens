"use client";

import { useRef, useState } from "react";
import { FileText } from "lucide-react";
import { verifyCommunication, verifyCommunicationFile } from "@/lib/api";
import { CommunicationVerifyResult } from "@/lib/types";

interface VerifyInputProps {
  onResult: (result: CommunicationVerifyResult) => void;
}

export default function VerifyInput({ onResult }: VerifyInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    if (!text.trim() && !file) return;
    setLoading(true);
    setError(null);
    try {
      const res = file ? await verifyCommunicationFile(file) : await verifyCommunication(text.trim());
      onResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-[14px] border border-hair border-border bg-card p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[1px] text-text-muted">Paste communication text</p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (e.target.value) setFile(null);
        }}
        placeholder="Dear Investor, SEBI hereby notifies..."
        className="mt-1.5 h-20 w-full resize-none rounded-btn border border-hair border-border bg-[#f8f8f8] p-2.5 font-mono text-[11px] text-text-primary outline-none placeholder:text-text-muted"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        className="mt-2 cursor-pointer rounded-btn border-[1.5px] border-dashed border-[#dddddd] bg-[#f8f8f8] p-3.5 text-center"
      >
        <FileText size={18} className="mx-auto text-text-muted" />
        <p className="mt-1 text-xs text-text-muted">{file ? file.name : "or drag & drop a PDF"}</p>
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
        className="mt-2.5 w-full rounded-btn bg-[#111111] py-2.5 text-[11px] font-bold text-white disabled:opacity-50"
      >
        {loading ? "Verifying…" : "Verify authenticity →"}
      </button>

      {error && <p className="mt-2 text-[10px] text-danger">{error}</p>}
    </div>
  );
}

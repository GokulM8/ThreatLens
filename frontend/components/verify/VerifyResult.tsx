import { Check, X } from "lucide-react";
import { CommunicationVerifyResult } from "@/lib/types";

export default function VerifyResult({ result }: { result: CommunicationVerifyResult | null }) {
  if (!result) return null;

  if (result.verified) {
    const date = result.registered_at ? new Date(result.registered_at).toLocaleDateString() : null;
    return (
      <div
        className="w-full rounded-card p-3.5"
        style={{ backgroundColor: "#f0faf5", border: "0.5px solid #1D9E7540", borderTop: "2px solid #1D9E75" }}
      >
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent">
            <Check size={18} color="white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-accent">Verified — Authentic communication</p>
            <p className="mt-1 text-[10px]" style={{ color: "#3a8a60" }}>
              Source confirmed via official registry{result.source ? ` · ${result.source}` : ""}
              {date ? ` · ${date}` : ""}
            </p>
            <span className="mt-2 inline-block rounded-[5px] bg-white px-2 py-1 font-mono text-[9px] text-text-muted">
              Hash: {result.hash.slice(0, 16)}… · {result.exact_match ? "Match found" : "Similar match found"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-card p-3.5"
      style={{ backgroundColor: "#fff0f0", border: "0.5px solid #ffd5d5", borderTop: "2px solid #E24B4A" }}
    >
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger">
          <X size={18} color="white" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-danger">Unverified — No registry match</p>
          <p className="mt-1 text-[10px]" style={{ color: "#c05050" }}>
            This communication could not be verified
          </p>
          <span className="mt-2 inline-block rounded-[5px] bg-white px-2 py-1 text-[9px] font-semibold text-danger">
            Do not act on this communication
          </span>
        </div>
      </div>
    </div>
  );
}

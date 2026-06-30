"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageTopnav from "@/components/layout/PageTopnav";
import TabBar from "@/components/analyze/TabBar";
import URLTab from "@/components/analyze/URLTab";
import EmailTab from "@/components/analyze/EmailTab";
import MediaTab from "@/components/analyze/MediaTab";
import CommTab from "@/components/analyze/CommTab";
import SessionHistory from "@/components/analyze/SessionHistory";
import { LastScanResult } from "@/lib/types";

type Tab = "url" | "email" | "media" | "comm";

const TABS: { id: Tab; label: string }[] = [
  { id: "url", label: "URL" },
  { id: "email", label: "Email" },
  { id: "media", label: "Media" },
  { id: "comm", label: "Communication" },
];

const TIPS = [
  "Paste full URL including https://",
  "Score above 70 = high risk",
  "Red SHAP = phishing signal",
  "Use Email tab for message text",
];

// /analyze?tab=email|media|comm deep-links here from the dashboard sidebar
// (content tab was renamed "email" in this rebuild — kept in sync below).
function resolveInitialTab(value: string | null): Tab {
  if (value === "content") return "email";
  if (value === "url" || value === "email" || value === "media" || value === "comm") return value;
  return "url";
}

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => resolveInitialTab(searchParams.get("tab")));
  const [fadeKey, setFadeKey] = useState(0);

  // Deep-linked from the dashboard's "Block" button: /analyze?tab=url&url=...
  const [urlValue, setUrlValue] = useState(() => searchParams.get("url") ?? "");
  const [urlResult, setUrlResult] = useState<LastScanResult | null>(null);

  const [sessionItems, setSessionItems] = useState<LastScanResult[]>([]);

  function changeTab(tab: Tab) {
    setActiveTab(tab);
    setFadeKey((k) => k + 1);
  }

  function recordScan(result: LastScanResult) {
    setSessionItems((items) => [result, ...items]);
  }

  function handleSelectHistory(item: LastScanResult) {
    setActiveTab("url");
    setFadeKey((k) => k + 1);
    setUrlValue(item.subject);
    setUrlResult(item);
  }

  return (
    <div className="grid gap-3.5 p-5" style={{ gridTemplateColumns: "1fr 220px" }}>
      <div>
        <TabBar tabs={TABS} activeTab={activeTab} onChange={changeTab} />

        <div key={fadeKey} className="mt-3 animate-fade-up" style={{ animationDuration: "200ms" }}>
          {activeTab === "url" && (
            <URLTab
              value={urlValue}
              onValueChange={setUrlValue}
              result={urlResult}
              onResult={(r) => {
                setUrlResult(r);
                recordScan(r);
              }}
            />
          )}
          {activeTab === "email" && <EmailTab onScanned={recordScan} />}
          {activeTab === "media" && <MediaTab onScanned={recordScan} />}
          {activeTab === "comm" && <CommTab />}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SessionHistory items={sessionItems} onSelect={handleSelectHistory} />

        <div className="rounded-[10px] border border-hair p-2.5" style={{ backgroundColor: "#f0faf5", borderColor: "#1D9E7530" }}>
          <p className="text-[10px] font-semibold text-accent">💡 Tips</p>
          <div className="mt-1.5 space-y-1">
            {TIPS.map((tip) => (
              <p key={tip} className="text-[9px]" style={{ color: "#2a6a50" }}>
                ✓ {tip}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <div className="min-h-screen bg-page">
      <PageTopnav
        rightSlot={
          <button className="rounded-md bg-[#111111] px-3.5 py-1.5 text-xs font-bold text-white">New scan</button>
        }
      />
      <Suspense fallback={<div className="p-5 text-xs text-text-muted">Loading…</div>}>
        <AnalyzeContent />
      </Suspense>
    </div>
  );
}

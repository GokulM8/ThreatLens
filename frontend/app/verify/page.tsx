"use client";

import { useState } from "react";
import PageTopnav from "@/components/layout/PageTopnav";
import VerifyInput from "@/components/verify/VerifyInput";
import VerifyResult from "@/components/verify/VerifyResult";
import HowItWorks from "@/components/verify/HowItWorks";
import { CommunicationVerifyResult } from "@/lib/types";

export default function VerifyPage() {
  const [result, setResult] = useState<CommunicationVerifyResult | null>(null);

  return (
    <div className="min-h-screen bg-page">
      <PageTopnav />

      <div className="flex flex-col items-center gap-4 px-5 py-10">
        <div className="w-full max-w-[480px]">
          <h1 className="text-center text-xl font-extrabold tracking-[-0.5px] text-text-primary">
            Verify communication
          </h1>
          <p className="mx-auto mt-1 max-w-[340px] text-center text-xs text-text-muted">
            Check if a financial communication is genuine against the official registry
          </p>
        </div>

        <VerifyInput onResult={setResult} />
        <VerifyResult result={result} />
        <HowItWorks />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { LastScanResult } from "./types";

const STORAGE_KEY = "threatlens:last-scan";

export function useLastScan() {
  const [lastScan, setLastScanState] = useState<LastScanResult | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setLastScanState(JSON.parse(raw));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function setLastScan(result: LastScanResult) {
    setLastScanState(result);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  }

  return { lastScan, setLastScan };
}

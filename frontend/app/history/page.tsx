"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import PageTopnav from "@/components/layout/PageTopnav";
import FilterBar, { ScanFilter } from "@/components/history/FilterBar";
import ScanTable from "@/components/history/ScanTable";
import DetailDrawer from "@/components/history/DetailDrawer";
import Pagination from "@/components/history/Pagination";
import { getDashboardStats } from "@/lib/api";
import { ScanHistoryRow } from "@/lib/types";

const PAGE_SIZE = 20;
const VALID_FILTERS: ScanFilter[] = ["all", "url", "email", "media", "comms", "high", "medium", "safe"];

function scanType(url: string): string {
  const match = url.match(/^<(.+)-submission>$/);
  return match ? match[1] : "url";
}

// Deep-linked from the dashboard's "Active threats" panel: /history?filter=high.
// Read directly from the browser location instead of useSearchParams() so
// this page doesn't need a Suspense boundary just to resolve one default —
// this is already a fully client-rendered page, nothing here is statically
// prerendered, so there's no SSR value being traded away.
function resolveInitialFilter(): ScanFilter {
  if (typeof window === "undefined") return "all";
  const value = new URLSearchParams(window.location.search).get("filter");
  return VALID_FILTERS.includes(value as ScanFilter) ? (value as ScanFilter) : "all";
}

function matchesFilter(row: ScanHistoryRow, filter: ScanFilter): boolean {
  if (filter === "all") return true;
  if (filter === "url") return scanType(row.url) === "url";
  if (filter === "email") return scanType(row.url) === "content";
  if (filter === "media") return scanType(row.url) === "media";
  if (filter === "comms") return scanType(row.url) === "communication";
  if (filter === "high") return row.risk_label === "High risk";
  if (filter === "medium") return row.risk_label === "Medium";
  if (filter === "safe") return row.risk_label === "Safe";
  return true;
}

function exportCsv(rows: ScanHistoryRow[]) {
  const header = "url,risk_score,verdict,risk_label,hash,timestamp\n";
  const body = rows
    .map((r) => [r.url, r.risk_score, r.verdict, r.risk_label, r.hash, r.timestamp].map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob([header + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "threatlens-scan-history.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryPage() {
  const { data: stats, isLoading } = useSWR("dashboard-stats-history", getDashboardStats, {
    refreshInterval: 30000,
  });
  const [filter, setFilter] = useState<ScanFilter>(resolveInitialFilter);
  const [page, setPage] = useState(1);
  const [selectedScan, setSelectedScan] = useState<ScanHistoryRow | null>(null);

  // NOTE: backend/routers/dashboard.py only ever returns up to 6 scan_history
  // rows regardless of query params (there's no GET /api/scans with real
  // pagination yet) — so this table reflects the most recent real scans
  // available via the dashboard endpoint, paginated/filtered client-side.
  const allRows = stats?.recent_scans ?? [];
  const filteredRows = useMemo(() => allRows.filter((r) => matchesFilter(r, filter)), [allRows, filter]);
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFilterChange(next: ScanFilter) {
    setFilter(next);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-page">
      <PageTopnav
        rightSlot={
          <button
            onClick={() => exportCsv(filteredRows)}
            className="rounded-md border border-hair border-border bg-card px-3.5 py-1.5 text-xs text-text-secondary"
          >
            Export CSV
          </button>
        }
      />

      <div className="p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-text-primary" style={{ fontSize: 16 }}>
              Scan history
            </p>
            <p className="text-[10px] text-text-muted">{stats?.total_scans ?? 0} total scans · all time</p>
          </div>
          <span className="rounded-md border border-hair border-border bg-card px-2.5 py-1 text-[10px] text-text-secondary">
            📅 Last 30 days
          </span>
        </div>

        <FilterBar active={filter} onChange={handleFilterChange} onExport={() => exportCsv(filteredRows)} />

        {isLoading ? (
          <p className="px-3 py-6 text-xs text-text-muted">Loading scan history…</p>
        ) : (
          <>
            <ScanTable rows={pageRows} onRowClick={setSelectedScan} />
            <Pagination currentPage={page} pageSize={PAGE_SIZE} totalItems={filteredRows.length} onPageChange={setPage} />
          </>
        )}
      </div>

      <DetailDrawer scan={selectedScan} onClose={() => setSelectedScan(null)} />
    </div>
  );
}

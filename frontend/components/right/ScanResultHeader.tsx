interface ScanResultHeaderProps {
  subtext: string;
}

export default function ScanResultHeader({ subtext }: ScanResultHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-section text-text-primary">
          Scan
          <br />
          Result
        </h2>
        <p className="mt-1 max-w-[180px] truncate text-xs text-text-muted">{subtext}</p>
      </div>
      <button className="rounded-pill border border-hair border-border bg-surface px-3 py-1.5 text-xs text-text-secondary">
        Limit ⇒
      </button>
    </div>
  );
}

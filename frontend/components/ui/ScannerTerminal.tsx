import { ReactNode } from "react";

export default function ScannerTerminal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-feature border border-hair border-border bg-card shadow-scanner ${className}`}>
      <div className="flex items-center gap-2 border-b border-hair border-border bg-[#f8f8f8] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-2xs text-text-muted">threatlens · scanner</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

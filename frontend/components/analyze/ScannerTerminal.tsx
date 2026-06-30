import { ReactNode } from "react";

export default function ScannerTerminal({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-card border border-hair border-border bg-card">
      <div className="flex items-center gap-2 border-b border-hair border-border bg-[#f8f8f8] px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
          <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
          <span className="h-2 w-2 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[9px] text-[#cccccc]">threatlens · scanner</span>
      </div>
      <div className="flex items-center gap-2 px-3.5 py-3">{children}</div>
    </div>
  );
}

import { ReactNode } from "react";

export default function DashboardRightPanel({ children }: { children: ReactNode }) {
  return (
    <aside className="flex h-full w-[260px] flex-col gap-3 overflow-y-auto bg-card p-4">
      {children}
    </aside>
  );
}

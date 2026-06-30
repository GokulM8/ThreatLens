"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoIcon } from "../ui/Logo";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analyze", label: "Analyze" },
  { href: "/verify", label: "Verify" },
  { href: "/history", label: "History" },
  { href: "/insights", label: "Insights" },
];

interface PageTopnavProps {
  rightSlot?: ReactNode;
}

export default function PageTopnav({ rightSlot }: PageTopnavProps) {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between border-b border-hair border-border bg-card px-6 py-3">
      <Link href="/" className="flex items-center gap-2">
        <LogoIcon size={26} mode="light" />
        <span className="text-[15px] font-extrabold text-text-primary">ThreatLens</span>
      </Link>

      <nav className="flex items-center gap-6">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className="pb-1 text-sm transition-colors"
              style={{
                color: active ? "#111111" : "#aaaaaa",
                fontWeight: active ? 600 : 400,
                borderBottom: active ? "1.5px solid #1D9E75" : "1.5px solid transparent",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex min-w-[100px] items-center justify-end">{rightSlot}</div>
    </header>
  );
}

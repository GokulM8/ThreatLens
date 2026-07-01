"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LogoIcon } from "../ui/Logo";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analyze", label: "Analyze" },
  { href: "/verify", label: "Verify" },
  { href: "/history", label: "History" },
  { href: "/insights", label: "Insights" },
];

const NAV_HREFS = LINKS.map((l) => l.href);

interface PageTopnavProps {
  rightSlot?: ReactNode;
}

export default function PageTopnav({ rightSlot }: PageTopnavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const currentIdx = NAV_HREFS.indexOf(pathname ?? "");
  const prevPage = currentIdx > 0 ? NAV_HREFS[currentIdx - 1] : null;
  const nextPage = currentIdx < NAV_HREFS.length - 1 ? NAV_HREFS[currentIdx + 1] : null;

  const prevLabel = prevPage ? LINKS[currentIdx - 1]?.label : null;
  const nextLabel = nextPage ? LINKS[currentIdx + 1]?.label : null;

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

      <div className="flex min-w-[100px] items-center justify-end gap-2">
        {/* Prev / Next page navigation */}
        <div className="flex items-center overflow-hidden rounded-btn border border-hair border-border">
          <button
            onClick={() => prevPage && router.push(prevPage)}
            disabled={!prevPage}
            title={prevLabel ? `← ${prevLabel}` : undefined}
            className="flex h-7 w-7 items-center justify-center text-text-muted transition-colors hover:bg-tint-gray hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="h-3.5 w-px bg-border" />
          <button
            onClick={() => nextPage && router.push(nextPage)}
            disabled={!nextPage}
            title={nextLabel ? `${nextLabel} →` : undefined}
            className="flex h-7 w-7 items-center justify-center text-text-muted transition-colors hover:bg-tint-gray hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {rightSlot}
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "../ui/Logo";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analyze", label: "Analyze" },
  { href: "/verify", label: "Verify" },
  { href: `${API_URL}/docs`, label: "API", external: true },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-40 border-b border-hair border-border bg-white/85 backdrop-blur-md transition-[padding] duration-300 ${
        scrolled ? "py-2.5" : "py-4"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Logo size={26} mode="light" />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-tint-success px-2.5 py-1 text-2xs font-semibold text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Live
          </span>
        </div>

        <div className="flex items-center gap-6">
          {LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-text-muted transition-colors hover:text-text-primary"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-text-muted transition-colors hover:text-text-primary"
              >
                {link.label}
              </Link>
            )
          )}
          <Link
            href="/analyze"
            className="rounded-cta bg-scan-card px-4 py-2 text-sm font-bold text-white"
          >
            Get started →
          </Link>
        </div>
      </div>
    </nav>
  );
}

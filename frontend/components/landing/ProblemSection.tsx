"use client";

import { useScrollReveal } from "../ui/animations";

const PROBLEMS = [
  {
    title: "Blocklists lag reality",
    body: "Static blocklists only catch phishing domains after they've already been reported — by then, the damage to the first wave of investors is already done.",
  },
  {
    title: "Deepfakes go unchecked",
    body: "Most security tools only look at URLs and text. Synthetic media impersonating regulators and exchange officials slips through entirely.",
  },
  {
    title: "Black-box scores investors can't trust",
    body: "A risk score with no explanation gives an investor nothing to act on. Without knowing *why* something was flagged, the warning gets ignored.",
  },
];

function ProblemCard({ title, body, index }: { title: string; body: string; index: number }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`rounded-card border border-hair p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        visible ? "animate-fade-up" : "opacity-0"
      }`}
      style={{ borderTop: "2px solid #E24B4A", borderColor: "#ffd5d5", transitionDelay: visible ? `${index * 100}ms` : "0ms" }}
    >
      <p className="text-base font-semibold text-text-primary">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>
    </div>
  );
}

export default function ProblemSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <p className="text-center text-xs font-semibold uppercase tracking-[1.5px] text-danger">The problem</p>
      <h2 className="mt-2 text-center text-landing-section text-text-primary">Why current solutions fail</h2>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {PROBLEMS.map((p, i) => (
          <ProblemCard key={p.title} {...p} index={i} />
        ))}
      </div>
    </section>
  );
}

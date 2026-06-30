"use client";

import { useScrollReveal } from "../ui/animations";

const STEPS = [
  { title: "Paste or upload", body: "Drop in a URL, message text, image/video, or a communication to verify." },
  { title: "Hybrid scoring", body: "A trained ML model and a 9-rule heuristic engine each score it independently." },
  { title: "Explained verdict", body: "SHAP breaks down exactly which features pushed the score up or down." },
  { title: "Act with confidence", body: "Block, flag, or confirm — backed by a real, auditable reason every time." },
];

function StepCard({ title, body, index }: { title: string; body: string; index: number }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`rounded-card border border-hair border-border bg-card p-5 transition-all duration-300 hover:border-border-accent hover:shadow-lg ${
        visible ? "animate-fade-up" : "opacity-0"
      }`}
      style={{ transitionDelay: visible ? `${index * 100}ms` : "0ms" }}
    >
      <p className="text-xs font-bold text-accent">{String(index + 1).padStart(2, "0")}</p>
      <p className="mt-2 text-sm font-semibold text-text-primary">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{body}</p>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <p className="text-center text-xs font-semibold uppercase tracking-[1.5px] text-accent">How it works</p>
      <h2 className="mt-2 text-center text-landing-section text-text-primary">From paste to verdict in seconds</h2>

      <div className="mt-12 grid gap-5 sm:grid-cols-4">
        {STEPS.map((s, i) => (
          <StepCard key={s.title} {...s} index={i} />
        ))}
      </div>
    </section>
  );
}

"use client";

import { Code2, Eye, LayoutDashboard, Link2, ListChecks, ShieldCheck } from "lucide-react";
import { useScrollReveal } from "../ui/animations";

const FEATURES = [
  {
    icon: Link2,
    iconBg: "#fff0f0",
    iconColor: "#E24B4A",
    title: "Phishing URL detection",
    body: "24-feature hybrid ML model (RandomForest + XGBoost) scores URLs in real time, with SHAP explaining exactly which signals drove the verdict.",
  },
  {
    icon: Eye,
    iconBg: "#fff8ed",
    iconColor: "#EF9F27",
    title: "Synthetic media detection",
    body: "EXIF metadata and frequency-domain analysis flag likely AI-generated images impersonating officials or regulators.",
  },
  {
    icon: ShieldCheck,
    iconBg: "#f0faf5",
    iconColor: "#1D9E75",
    title: "Communication verifier",
    body: "Cryptographic hash lookup with pgvector similarity fallback against a registry of genuine SEBI and exchange notices.",
  },
  {
    icon: ListChecks,
    iconBg: "#f5f5f5",
    iconColor: "#555555",
    title: "9-rule heuristic overlay",
    body: "A transparent YAML rules engine runs alongside the ML model, catching IP hosts, punycode, link shorteners, and more.",
  },
  {
    icon: LayoutDashboard,
    iconBg: "#f0faf5",
    iconColor: "#1D9E75",
    title: "Live dashboard",
    body: "Real aggregate threat stats, scan history, and a 7-day timeline — refreshed every 30 seconds, backed by Supabase.",
  },
  {
    icon: Code2,
    iconBg: "#fff8ed",
    iconColor: "#EF9F27",
    title: "REST API",
    body: "Every detector is a documented FastAPI endpoint — drop it into your own pipeline, no UI required.",
  },
];

function FeatureCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  body,
  index,
}: (typeof FEATURES)[number] & { index: number }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-feature border border-hair border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-border-accent ${
        visible ? "animate-fade-up" : "opacity-0"
      }`}
      style={{ transitionDelay: visible ? `${index * 100}ms` : "0ms" }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-feature opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(29,158,117,0.08), transparent 70%)" }}
      />
      <div className="relative flex h-7 w-7 items-center justify-center rounded-btn" style={{ backgroundColor: iconBg }}>
        <Icon size={14} color={iconColor} />
      </div>
      <p className="relative mt-4 text-sm font-semibold text-text-primary">{title}</p>
      <p className="relative mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <p className="text-center text-xs font-semibold uppercase tracking-[1.5px] text-accent">Solution</p>
      <h2 className="mt-2 text-center text-landing-section text-text-primary">Three layers of protection</h2>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.title} {...f} index={i} />
        ))}
      </div>
    </section>
  );
}

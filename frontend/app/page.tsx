import Link from "next/link";
import { Github } from "lucide-react";
import LandingNav from "@/components/layout/LandingNav";
import { CustomCursor, MouseGlow } from "@/components/ui/animations";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import DemoSection from "@/components/landing/DemoSection";
import CtaSection from "@/components/landing/CtaSection";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-page" style={{ cursor: "none" }}>
      <CustomCursor />
      <MouseGlow />
      <LandingNav />

      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoSection />
      <CtaSection />

      <footer className="border-t border-hair border-border bg-card px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="text-xs text-text-muted">© {new Date().getFullYear()} ThreatLens. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs text-text-muted">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-text-primary"
            >
              <Github size={13} /> GitHub
            </a>
            <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer" className="hover:text-text-primary">
              API Docs
            </a>
            <Link href="/dashboard" className="hover:text-text-primary">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

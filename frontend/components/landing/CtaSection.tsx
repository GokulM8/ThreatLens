import Link from "next/link";
import { AuroraBlob } from "../ui/animations";

export default function CtaSection() {
  return (
    <section className="relative overflow-hidden px-6 py-32 text-center">
      <AuroraBlob color="rgba(29,158,117,0.18)" className="left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2" />

      <h2 className="relative text-[52px] font-black leading-tight tracking-[-2px] text-text-primary">
        Ready to protect your investors?
      </h2>
      <p className="relative mx-auto mt-4 max-w-md text-sm text-text-muted">
        Run your first real scan in under a minute — no signup required.
      </p>
      <div className="relative mt-8 flex items-center justify-center gap-3">
        <Link href="/analyze" className="rounded-cta bg-scan-card px-6 py-3 text-sm font-bold text-white">
          Get started →
        </Link>
        <Link
          href="/dashboard"
          className="rounded-cta border border-hair border-border bg-white px-6 py-3 text-sm font-bold text-text-primary"
        >
          View dashboard
        </Link>
      </div>
    </section>
  );
}

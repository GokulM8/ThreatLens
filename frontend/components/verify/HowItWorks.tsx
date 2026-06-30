const STEPS = [
  { step: "01", title: "Submit", body: "Paste text or upload PDF" },
  { step: "02", title: "Hash", body: "SHA-256 computed from content" },
  { step: "03", title: "Lookup", body: "Cross-reference registry" },
  { step: "04", title: "Result", body: "Verified or flagged fake" },
];

export default function HowItWorks() {
  return (
    <div className="grid w-full grid-cols-4 gap-2">
      {STEPS.map((s) => (
        <div key={s.step} className="rounded-btn border border-hair border-border bg-card p-2.5 text-center">
          <p className="mb-1 text-[9px] font-bold tracking-[1px] text-accent">{s.step}</p>
          <p className="mb-0.5 text-[10px] font-semibold text-text-primary">{s.title}</p>
          <p className="text-[9px] leading-relaxed text-text-muted">{s.body}</p>
        </div>
      ))}
    </div>
  );
}

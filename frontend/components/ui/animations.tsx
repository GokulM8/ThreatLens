"use client";

import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, duration = 1200, start = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);

  return value;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.1) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

export function AuroraBlob({ color, className = "" }: { color: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute animate-aurora rounded-full blur-3xl ${className}`}
      style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }}
    />
  );
}

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function move(e: MouseEvent) {
      dotRef.current?.style.setProperty("transform", `translate(${e.clientX - 5}px, ${e.clientY - 5}px)`);
      ringRef.current?.style.setProperty("transform", `translate(${e.clientX - 16}px, ${e.clientY - 16}px)`);
    }
    function over(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const hovering = !!target.closest("button, a, [data-cursor-hover]");
      ringRef.current?.classList.toggle("scale-150", hovering);
      ringRef.current?.classList.toggle("border-accent", hovering);
    }

    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "none";
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => {
      document.body.style.cursor = previousCursor;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-[10px] w-[10px] rounded-full bg-accent"
        style={{ willChange: "transform" }}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-8 w-8 rounded-full border border-accent/40 transition-transform duration-200"
        style={{ willChange: "transform" }}
      />
    </>
  );
}

export function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function move(e: MouseEvent) {
      ref.current?.style.setProperty("transform", `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`);
    }
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-0 h-[400px] w-[400px] rounded-full"
      style={{ background: "radial-gradient(circle, rgba(29,158,117,0.06), transparent 70%)", willChange: "transform" }}
    />
  );
}

export function ScannerWaveBars() {
  return (
    <div className="flex h-4 items-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="h-full w-1 origin-center animate-wave rounded-full bg-accent"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

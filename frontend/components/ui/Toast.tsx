"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

interface ToastProps {
  message: string;
  show: boolean;
  onDismiss: () => void;
}

export default function Toast({ message, show, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-card border border-hair border-border bg-card px-4 py-3 text-sm text-text-primary shadow-scanner animate-toast-in">
      <CheckCircle2 size={16} className="text-accent" />
      {message}
    </div>
  );
}

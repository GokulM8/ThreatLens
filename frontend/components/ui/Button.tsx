import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  children: ReactNode;
}

export default function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-btn px-3.5 py-2 text-xs font-medium transition-colors";
  const variants = {
    primary: "bg-accent text-white hover:opacity-90",
    ghost: "bg-surface border border-border text-text-secondary hover:text-text-primary",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        page: "#F0F2F5",
        card: "#ffffff",
        border: "#eeeeee",
        "scan-card": "#111111",
        accent: "#1D9E75",
        danger: "#E24B4A",
        warning: "#EF9F27",
        "text-primary": "#111111",
        "text-secondary": "#555555",
        "text-muted": "#aaaaaa",
        "tint-danger": "#fff0f0",
        "tint-warning": "#fff8ed",
        "tint-success": "#f0faf5",
        "tint-gray": "#f5f5f5",
        "border-danger": "#ffd5d5",
        "border-accent": "rgba(29,158,117,0.3)",
      },
      fontSize: {
        "2xs": ["9px", { letterSpacing: "0.3px" }],
        xs: ["10px", { letterSpacing: "0.1px" }],
        sm: ["11px", { letterSpacing: "0px" }],
        base: ["13px", { letterSpacing: "0px" }],
        section: ["13px", { fontWeight: "600" }],
        greeting: ["22px", { letterSpacing: "-0.5px", fontWeight: "700" }],
        hero: ["22px", { letterSpacing: "-0.5px", fontWeight: "700" }],
        "hero-lg": ["42px", { letterSpacing: "-0.5px", fontWeight: "800" }],
        "dash-title": ["20px", { letterSpacing: "-0.3px", fontWeight: "700" }],
        "landing-hero": ["64px", { letterSpacing: "-3px", fontWeight: "900", lineHeight: "1.05" }],
        "landing-section": ["38px", { letterSpacing: "-1.5px", fontWeight: "800" }],
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        cta: "10px",
        pill: "20px",
        feature: "16px",
        demo: "20px",
      },
      borderWidth: {
        DEFAULT: "0.5px",
        hair: "0.5px",
      },
      boxShadow: {
        none: "none",
        scanner: "0 4px 40px rgba(0,0,0,0.06)",
      },
      keyframes: {
        aurora: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.5" },
          "50%": { transform: "scale(1.15)", opacity: "0.8" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
        "toast-in": {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-up": {
          "0%": { transform: "translateY(28px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        aurora: "aurora 6s ease-in-out infinite",
        shimmer: "shimmer 4s linear infinite",
        wave: "wave 1s ease-in-out infinite",
        "toast-in": "toast-in 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        "fade-up": "fade-up 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;

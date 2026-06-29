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
        bg: "#060A0D",
        "bg-secondary": "#070C10",
        surface: "#0a1218",
        "surface-inner": "#0d1a18",
        border: "#0e1820",
        accent: "#1D9E75",
        danger: "#E24B4A",
        warning: "#EF9F27",
        "text-primary": "#c8e0e8",
        "text-muted": "#1a3a30",
        "text-secondary": "#2a5048",
        "text-link": "#7ab8a8",
      },
      fontSize: {
        "2xs": ["9px", { letterSpacing: "1.5px" }],
        xs: ["10px", { letterSpacing: "0.2px" }],
        sm: ["11px", { letterSpacing: "0.1px" }],
        base: ["12px", { letterSpacing: "0px" }],
        section: ["20px", { letterSpacing: "-0.3px", fontWeight: "700" }],
        hero: ["38px", { letterSpacing: "-1.5px", fontWeight: "800" }],
        "hero-lg": ["54px", { letterSpacing: "-1.5px", fontWeight: "800" }],
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        pill: "30px",
      },
      borderWidth: {
        DEFAULT: "0.5px",
        hair: "0.5px",
        accent: "1.5px",
      },
      boxShadow: {
        none: "none",
      },
    },
  },
  plugins: [],
};

export default config;

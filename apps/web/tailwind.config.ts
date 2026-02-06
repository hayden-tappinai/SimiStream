import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "hsl(var(--surface))",
          raised: "hsl(var(--surface-raised))",
          overlay: "hsl(var(--surface-overlay))",
        },
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        live: "hsl(var(--live))",
        industry: {
          healthcare: "hsl(var(--industry-healthcare))",
          emergency: "hsl(var(--industry-emergency))",
          food: "hsl(var(--industry-food))",
          finance: "hsl(var(--industry-finance))",
          entertainment: "hsl(var(--industry-entertainment))",
          veterinary: "hsl(var(--industry-veterinary))",
        },
        outcome: {
          optimal: "hsl(var(--outcome-optimal))",
          acceptable: "hsl(var(--outcome-acceptable))",
          suboptimal: "hsl(var(--outcome-suboptimal))",
          critical: "hsl(var(--outcome-critical))",
        },
        severity: {
          low: "hsl(var(--severity-low))",
          medium: "hsl(var(--severity-medium))",
          high: "hsl(var(--severity-high))",
          critical: "hsl(var(--severity-critical))",
        },
      },
      borderWidth: {
        3: "3px",
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px hsl(var(--border))",
        "brutal-sm": "2px 2px 0px 0px hsl(var(--border))",
        "brutal-accent": "4px 4px 0px 0px hsl(var(--accent))",
      },
      keyframes: {
        "pulse-live": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "pulse-live": "pulse-live 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

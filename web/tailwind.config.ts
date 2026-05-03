import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
          mute: "var(--ink-mute)",
          line: "var(--ink-line)",
        },
        paper: {
          DEFAULT: "var(--paper)",
          raised: "var(--paper-raised)",
          sunk: "var(--paper-sunk)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
        },
        signal: {
          carbon: "var(--signal-carbon)",
          latency: "var(--signal-latency)",
          cost: "var(--signal-cost)",
          warn: "var(--signal-warn)",
          ok: "var(--signal-ok)",
        },
      },
      fontFamily: {
        sans: ["Inter Tight", "Inter", "system-ui", "sans-serif"],
        serif: ['"Source Serif 4"', '"Source Serif Pro"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', "ui-monospace", "monospace"],
        deva: ['"Noto Sans Devanagari"', "system-ui", "sans-serif"],
        display: ['"Fraunces"', '"Source Serif 4"', "Georgia", "serif"],
      },
      fontSize: {
        "display-xl": ["clamp(3rem, 8vw, 6.5rem)", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
        "display-lg": ["clamp(2.25rem, 5vw, 4rem)", { lineHeight: "1", letterSpacing: "-0.035em" }],
        "display-md": ["clamp(1.625rem, 3vw, 2.5rem)", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
      animation: {
        "fade-up": "fadeUp 600ms cubic-bezier(0.22, 1, 0.36, 1)",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      boxShadow: {
        soft: "0 1px 0 rgba(0,0,0,0.04), 0 6px 16px -8px rgba(0,0,0,0.08)",
        deep: "0 1px 0 rgba(0,0,0,0.04), 0 24px 60px -28px rgba(0,0,0,0.35)",
      },
      backgroundImage: {
        grid: "linear-gradient(to right, var(--grid) 1px, transparent 1px), linear-gradient(to bottom, var(--grid) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
} satisfies Config;

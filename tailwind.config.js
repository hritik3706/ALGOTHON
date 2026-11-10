/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        fg: "var(--fg)",
        accent: {
          DEFAULT: "var(--accent)",
          ink: "var(--accent-ink)",
          glow: "var(--accent-glow)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
        },
        border: "var(--border)",
        "fg-muted": "var(--fg-muted)",
        "fg-faint": "var(--fg-faint)",
        danger: "var(--danger)",
      },
      fontFamily: {
        display: ["'Instrument Serif'", "Georgia", "serif"],
        ui: ["Geist", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        pill: "999px",
        card: "16px",
      },
      boxShadow: {
        glow: "0 0 50px -10px rgba(198, 244, 50, 0.35)",
        "glow-lg": "0 0 100px -15px rgba(198, 244, 50, 0.4)",
      },
    },
  },
  plugins: [],
}


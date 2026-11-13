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
          hover: "var(--accent-hover)",
          ink: "var(--accent-ink)",
          glow: "var(--accent-glow)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
        },
        paper: {
          DEFAULT: "var(--card-paper)",
          ink: "var(--card-paper-ink)",
        },
        border: "var(--border)",
        "fg-muted": "var(--fg-muted)",
        "fg-faint": "var(--fg-faint)",
        danger: "var(--danger)",
      },
      fontFamily: {
        display: ["'Newsreader'", "'Instrument Serif'", "Georgia", "serif"],
        ui: ["'Geist'", "'Inter'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        pill: "999px",
        card: "16px",
      },
      boxShadow: {
        glow: "0 0 50px -10px rgba(255, 107, 91, 0.35)",
        "glow-lg": "0 0 100px -15px rgba(255, 107, 91, 0.4)",
        flashcard: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 107, 91, 0.15)",
      },
    },
  },
  plugins: [],
}


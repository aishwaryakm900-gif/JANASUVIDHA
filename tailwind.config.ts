import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          deep: "#12343B",
          primary: "#147D78",
          hover: "#0e5e5a",
          light: "#1e9d97",
          soft: "#E8F4F1",
          subtle: "#F0F8F6",
        },
        surface: {
          bg: "#F5F8F7",
          card: "#FFFFFF",
          border: "#E2EBE8",
          hover: "#EDF4F2",
        },
        text: {
          main: "#263238",
          muted: "#607477",
          subtle: "#8A9EA0",
        },
        status: {
          new: "#0284C7",
          progress: "#D97706",
          resolved: "#0D9488",
          verified: "#059669",
          overdue: "#E11D48",
          escalated: "#7C3AED",
        },
      },
      fontFamily: {
        sans: ["var(--font-gilroy)", "Gilroy", "system-ui", "sans-serif"],
        gilroy: ["var(--font-gilroy)", "Gilroy", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px -2px rgba(18, 52, 59, 0.05), 0 1px 3px -1px rgba(18, 52, 59, 0.03)",
        "card-hover": "0 8px 24px -4px rgba(18, 52, 59, 0.08), 0 3px 6px -2px rgba(18, 52, 59, 0.04)",
        modal: "0 20px 40px -8px rgba(18, 52, 59, 0.15)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;


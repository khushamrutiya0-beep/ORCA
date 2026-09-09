import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        orca: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1468e8', // Primary ORCA Blue
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0f172a',
        },
        ocean: {
          950: "#040d1a",
          900: "#081b2e",
          850: "#0d263e",
          800: "#133352",
          700: "#1d4b73",
          600: "#276599",
          500: "#3884bf",
          400: "#5ba6db",
          300: "#8ac5ed",
          200: "#c0e2f8",
          100: "#e5f3fd",
          50: "#f0f9ff",
        },
        tactical: {
          gold: "#f59e0b",
          cyan: "#06b6d4",
          emerald: "#10b981",
          rose: "#f43f5e",
          amber: "#d97706",
          slate: "#1e293b",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        '2xs': "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
        'xs': "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        subtle: "0 2px 8px -2px rgba(15, 23, 42, 0.06), 0 1px 4px -1px rgba(15, 23, 42, 0.04)",
        elevated: "0 12px 30px -8px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        cardHover: "0 10px 25px -5px rgba(20, 104, 232, 0.08), 0 8px 10px -6px rgba(20, 104, 232, 0.04)",
        glow: "0 0 20px -5px rgba(20, 104, 232, 0.3)",
        dangerGlow: "0 0 20px -5px rgba(244, 63, 94, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;

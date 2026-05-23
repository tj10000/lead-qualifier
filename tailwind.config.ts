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
        cream: {
          50: "#fdfcf9",
          100: "#faf9f7",
          200: "#f5f0e8",
          300: "#ede6d8",
        },
        coral: {
          400: "#e8896b",
          500: "#d97757",
          600: "#c0392b",
          700: "#a93226",
        },
        warm: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.07)",
        "card-hover": "0 2px 6px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
};

export default config;

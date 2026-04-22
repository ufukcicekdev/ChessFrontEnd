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
        board: {
          light: "#f0d9b5",
          dark: "#b58863",
          highlight: "#cdd26a",
          "highlight-dark": "#aaa23a",
        },
      },
      animation: {
        "pulse-once": "pulse 0.6s ease-in-out 1",
      },
    },
  },
  plugins: [],
};

export default config;

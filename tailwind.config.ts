import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          black: "#050505",
          gray: {
            900: "#0A0A0A",
            800: "#121212",
            700: "#1A1A1A",
            600: "#242424",
            500: "#2E2E2E",
            400: "#3D3D3D",
            300: "#525252",
            200: "#6B6B6B",
            100: "#8A8A8A",
          },
          accent: {
            cyan: "#00F0FF",
            neon: "#ADFF2F",
            pink: "#FF0055", // Error color
            primary: "#00F0FF",
          },
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(0, 240, 255, 0.5)',
        'glow-neon': '0 0 20px -5px rgba(173, 255, 47, 0.5)',
        'glow-pink': '0 0 20px -5px rgba(255, 0, 85, 0.5)',
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: [
          "var(--font-geist-mono)",
          "JetBrains Mono",
          "Roboto Mono",
          "Consolas",
          "monospace",
        ],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

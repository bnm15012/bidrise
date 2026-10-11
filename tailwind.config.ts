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
        background: "var(--background)",
        foreground: "var(--foreground)",
        neon: {
          green: "#39FF14",
          pink: "#FF2D78",
          purple: "#BF5AF2",
          blue: "#0A84FF",
          yellow: "#FFD60A",
          orange: "#FF9F0A",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
        shimmer: "shimmer 2s linear infinite",
        "rank-up": "rankUp 0.5s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        rankUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glow-green":
          "radial-gradient(circle at center, rgba(57,255,20,0.15) 0%, transparent 70%)",
        "glow-pink":
          "radial-gradient(circle at center, rgba(255,45,120,0.15) 0%, transparent 70%)",
      },
    },
  },
  plugins: [],
};
export default config;

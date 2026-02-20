
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
        'accent-red': '#E74C3C',
        'accent-red-dim': '#c0392b', // Using hex directly? Or var? I'll use hex for direct tailwind. Or stick to var.
        // Actually, user defined vars. I'll use vars in globals.css and map them here if needed, or just use arbitrary values.
        // User used `bg-[#E74C3C]` a lot. So arbitrary values are fine.
        // But for `var(--bg-dark)` etc. mapping is better.
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-playfair)', 'serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Values come from CSS custom properties (set in app/layout.tsx from the admin's
        // Settings > Branding colors, falling back to the defaults below) so opacity
        // modifiers like `bg-brand/10` keep working while the color stays runtime-configurable.
        brand: {
          DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)",
          dark: "rgb(var(--brand-dark-rgb) / <alpha-value>)",
          light: "rgb(var(--brand-light-rgb) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          dark: "rgb(var(--accent-dark-rgb) / <alpha-value>)",
          light: "rgb(var(--accent-light-rgb) / <alpha-value>)",
        },
        // "Rang" redesign tokens — paper/surface/ink replace the old white/gray-900 pairing
        // and flip automatically between light/dark via CSS vars (see globals.css), so most
        // components need zero `dark:` variants. jade/plum are two fixed accent hues used
        // for category tiles and gradients; named to avoid colliding with Tailwind's built-in
        // emerald-*/violet-* scales, which PopularCategories/HeroCarousel already reference.
        paper: "rgb(var(--paper-rgb) / <alpha-value>)",
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--ink-rgb) / <alpha-value>)",
          soft: "rgb(var(--ink-soft-rgb) / <alpha-value>)",
        },
        jade: "rgb(var(--jade-rgb) / <alpha-value>)",
        plum: "rgb(var(--plum-rgb) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        // Storefront-only geometric sans for the "Rang" redesign — admin keeps `font-sans` (Inter).
        rang: ["var(--font-rang-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(17, 24, 39, 0.04), 0 2px 8px rgba(17, 24, 39, 0.04)",
        card: "0 1px 3px rgba(17, 24, 39, 0.06), 0 1px 2px rgba(17, 24, 39, 0.04)",
        "card-hover": "0 12px 24px -8px rgba(196, 39, 107, 0.2), 0 4px 8px -2px rgba(17, 24, 39, 0.06)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

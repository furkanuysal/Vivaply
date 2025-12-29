/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        skin: {
          base: "rgb(var(--color-bg-base-rgb) / <alpha-value>)",
          surface: "rgb(var(--color-bg-surface-rgb) / <alpha-value>)",
          border: "rgb(var(--color-border-rgb) / <alpha-value>)",
          text: "rgb(var(--color-text-main-rgb) / <alpha-value>)",
          muted: "rgb(var(--color-text-muted-rgb) / <alpha-value>)",
          primary: "rgb(var(--color-primary-rgb) / <alpha-value>)",
          secondary: "rgb(var(--color-secondary-rgb) / <alpha-value>)",
          accent: "rgb(var(--color-accent-rgb) / <alpha-value>)",

          rating: {
            95: "rgb(var(--rating-95) / <alpha-value>)",
            90: "rgb(var(--rating-90) / <alpha-value>)",
            80: "rgb(var(--rating-80) / <alpha-value>)",
            70: "rgb(var(--rating-70) / <alpha-value>)",
            60: "rgb(var(--rating-60) / <alpha-value>)",
            45: "rgb(var(--rating-45) / <alpha-value>)",
            bad: "rgb(var(--rating-bad) / <alpha-value>)",
            none: "rgb(var(--rating-none) / <alpha-value>)",
          },
        },
      },
      borderColor: ({ theme }) => ({
        ...theme("colors"),
        DEFAULT: theme("colors.skin.border", "currentColor"),
      }),
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        skin: {
          base: "var(--color-bg-base)",
          surface: "var(--color-bg-surface)",
          border: "var(--color-border)",
          text: "var(--color-text-main)",
          muted: "var(--color-text-muted)",
          primary: "var(--color-primary-base)",
          secondary: "var(--color-secondary-base)",
          accent: "var(--color-accent)",

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

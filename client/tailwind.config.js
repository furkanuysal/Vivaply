/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
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
            95: "rgb(var(--rating-95-rgb) / <alpha-value>)",
            90: "rgb(var(--rating-90-rgb) / <alpha-value>)",
            80: "rgb(var(--rating-80-rgb) / <alpha-value>)",
            70: "rgb(var(--rating-70-rgb) / <alpha-value>)",
            60: "rgb(var(--rating-60-rgb) / <alpha-value>)",
            45: "rgb(var(--rating-45-rgb) / <alpha-value>)",
            bad: "rgb(var(--rating-bad-rgb) / <alpha-value>)",
            none: "rgb(var(--rating-none-rgb) / <alpha-value>)",
          },

          badge: {
            green: {
              bg: "rgb(var(--badge-green-bg-rgb) / <alpha-value>)",
              text: "rgb(var(--badge-green-text-rgb) / <alpha-value>)",
            },
            blue: {
              bg: "rgb(var(--badge-blue-bg-rgb) / <alpha-value>)",
              text: "rgb(var(--badge-blue-text-rgb) / <alpha-value>)",
            },
            red: {
              bg: "rgb(var(--badge-red-bg-rgb) / <alpha-value>)",
              text: "rgb(var(--badge-red-text-rgb) / <alpha-value>)",
            },
            yellow: {
              bg: "rgb(var(--badge-yellow-bg-rgb) / <alpha-value>)",
              text: "rgb(var(--badge-yellow-text-rgb) / <alpha-value>)",
            },
            purple: {
              bg: "rgb(var(--badge-purple-bg-rgb) / <alpha-value>)",
              text: "rgb(var(--badge-purple-text-rgb) / <alpha-value>)",
            },
            gray: {
              bg: "rgb(var(--badge-gray-bg-rgb) / <alpha-value>)",
              text: "rgb(var(--badge-gray-text-rgb) / <alpha-value>)",
            },
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

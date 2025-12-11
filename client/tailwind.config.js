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

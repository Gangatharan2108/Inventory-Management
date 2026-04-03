/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  important: true,

  darkMode: ["selector", "body.dark-mode"],

  theme: {
    extend: {
      colors: {
      },
    },
  },
  plugins: [],
}
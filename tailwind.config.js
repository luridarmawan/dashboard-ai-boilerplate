/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Tailwind v4 doesn't use darkMode config in the same way
  // Dark mode is handled via @custom-variant in CSS
}
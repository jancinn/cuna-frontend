/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-navy': '#0a192f',
        'soft-teal': '#5eead4', // teal-300 approx
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      animation: {
        popin: "popin 120ms ease-in-out"
      },
      keyframes: {
        popin: {
          "0%": {
            transform: 'scale(0)'
          },
          "100%": {
            transform: "scale(1)"
          }
        }
      }
    },
  },
  plugins: [],
}
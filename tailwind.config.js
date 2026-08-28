/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        gold:           '#c9a961',
        terracotta:     '#b65a3a',
        terracottaDeep: '#8d4128',
        ink:            '#2d241b',
        ivory:          '#fffaf2',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body:    ['Belleza', 'sans-serif'],
        script:  ['Great Vibes', 'cursive'],
        josefin: ['Josefin Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

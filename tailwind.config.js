/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#EAF3DE',100:'#C0DD97',400:'#639922',600:'#3B6D11',800:'#27500A',900:'#1a2e1a' },
        nutri: { 50:'#E1F5EE',100:'#9FE1CB',400:'#1D9E75',600:'#0F6E56' },
      },
    },
  },
  plugins: [],
}

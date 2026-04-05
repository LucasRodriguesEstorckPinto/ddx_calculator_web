/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ddx: {
          dark: '#050505',
          neon: '#39FF14',
          panel: 'rgba(20, 20, 20, 0.4)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
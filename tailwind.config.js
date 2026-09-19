/** @type {import('tailwindcss').Config} */
export default {
  // App.jsx toggles the `dark` class on <html>; without 'class' mode, dark: utilities would follow OS preference instead
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        dark: {
          900: '#070a11',
          800: '#0d1322',
          700: '#151d33',
          600: '#1e2945'
        }
      }
    },
  },
  plugins: [],
}

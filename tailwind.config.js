/** @type {import('tailwindcss').Config} */
export default {
  // Theme is driven by the `dark` class App.jsx toggles on <html>.
  // Without this, every `dark:` utility falls back to prefers-color-scheme
  // and the light theme renders dark text styles on light surfaces.
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

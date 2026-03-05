/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'dark-bg': '#0a0a0a',
        card: '#1a1a2e',
        accent: { DEFAULT: '#10b981', light: '#34d399', dark: '#059669' },
        danger: { DEFAULT: '#ef4444', dark: '#dc2626' },
        surface: {
          DEFAULT: '#0a0a0a',
          card: '#1a1a2e',
          hover: '#222240',
          border: '#2a2a4a',
        },
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

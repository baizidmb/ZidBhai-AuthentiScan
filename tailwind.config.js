/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: '#06B6D4',
          violet: '#8B5CF6',
          dark: '#020617',
          card: '#0f172a',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}

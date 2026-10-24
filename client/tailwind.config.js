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
          bg: '#080B14',
          sidebar: '#0D1220',
          card: '#111827',
          cardHover: '#182235',
          border: '#1F293D',
          borderLight: '#2D3748',
          primary: '#8B5CF6',
          primaryHover: '#7C3AED',
          accent: '#06B6D4',
          accentHover: '#0891B2',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          muted: '#94A3B8',
          text: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

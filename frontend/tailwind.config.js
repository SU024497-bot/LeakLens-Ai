/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          brand: '#282B4A',
          dark: '#1B1D33',
          surface: '#33375E',
          accent: '#474C82',
          light: '#5D64A8',
        },
        vanilla: {
          brand: '#EEEBDA',
          bg: '#EEEBDA',
          card: '#F6F4EB',
          subtle: '#E4DFCB',
          border: '#D7D1BA',
          muted: '#8C8875',
        },
        status: {
          critical: '#DC2626',
          high: '#EA580C',
          medium: '#D97706',
          low: '#2563EB',
          success: '#059669',
          neutral: '#6B7280'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 4px 20px -2px rgba(40, 43, 74, 0.05)',
        'elevated': '0 10px 30px -5px rgba(40, 43, 74, 0.08), 0 4px 12px -2px rgba(40, 43, 74, 0.04)',
        'glass': '0 8px 32px 0 rgba(40, 43, 74, 0.06)',
      }
    },
  },
  plugins: [],
}

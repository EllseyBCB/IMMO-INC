/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        ink: {
          900: '#0f1720',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
        },
        brand: {
          50: '#eef6ff',
          100: '#d9ecff',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
        },
        money: {
          up: '#059669',
          down: '#dc2626',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,32,0.06), 0 8px 24px rgba(15,23,32,0.06)',
        soft: '0 1px 2px rgba(15,23,32,0.05)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}

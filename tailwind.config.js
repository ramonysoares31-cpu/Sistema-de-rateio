/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#b9cdff',
          300: '#89a9ff',
          400: '#5578ff',
          500: '#2d4bff',
          600: '#1a2ef5',
          700: '#151fd8',
          800: '#161cae',
          900: '#181e89',
          950: '#101254',
        },
        gold: {
          400: '#f0b429',
          500: '#de9a04',
          600: '#b87d00',
        },
        surface: {
          50:  '#f8f9fc',
          100: '#f0f2f8',
          200: '#e2e6f0',
          800: '#1e2235',
          900: '#141727',
          950: '#0d0f1e',
        }
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 4px 16px -2px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,0.08), 0 12px 32px -4px rgba(0,0,0,0.12)',
        'modal': '0 20px 60px -10px rgba(0,0,0,0.3)',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      }
    },
  },
  plugins: [],
}

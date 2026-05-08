/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f9f1e7',
          100: '#ead4b9',
          200: '#d7ad75',
          300: '#c78c3e',
          400: '#b9772d',
          500: '#a35f21',
          600: '#7e4218',
          700: '#522813',
        },
        pulse: {
          bg: '#070403',
          nav: '#100a07',
          card: '#17100b',
          card2: '#21160f',
          border: '#3d2a1d',
          line: '#6c4a30',
          muted: '#a68c75',
          soft: '#dfc6ad',
          white: '#fff4e4',
          paper: '#090604',
          violet: '#d69a45',
          lavender: '#f0bd6a',
          rust: '#d96f42',
          ochre: '#e1ad56',
          blue: '#9ab6d8',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(214, 154, 69, .35), 0 16px 48px rgba(214, 154, 69, .18)',
        card: '0 22px 70px rgba(0, 0, 0, .38), inset 0 1px 0 rgba(255, 244, 228, .05)',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '480px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          600: '#1e3a5f',
          700: '#162d4a',
          800: '#0e1f34',
        },
      },
      animation: {
        'bounce-slow': 'bounceSlow 2.4s ease-in-out infinite',
        // The track renders its posts twice, so sliding exactly half its width
        // lands back on an identical frame and the loop is seamless.
        'marquee': 'marquee 45s linear infinite',
      },
      keyframes: {
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

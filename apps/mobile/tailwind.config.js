/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#020617',
        surface: '#12121A',
        accent: '#8b5cf6',
        'accent-to': '#06b6d4',
      },
    },
  },
  plugins: [],
};

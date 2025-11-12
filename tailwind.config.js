/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Paleta basada en el logo (de fucsia a cian)
        'brand-from': '#f72585',
        'brand-via': '#7c3aed',
        'brand-to': '#06b6d4',
        'brand-dark': '#0b0f14',
      },
    },
  },
  plugins: [],
};

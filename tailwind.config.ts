import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Emerald Primary
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Champagne Gold Accent
        accent: {
          50: '#FDFBF7',
          100: '#F9F4EA',
          200: '#F2E6D1',
          300: '#E8D3B1',
          400: '#DCB988',
          500: '#CD9E62',
          600: '#B58049',
          700: '#97623B',
          800: '#7A4D33',
          900: '#63402C',
          950: '#352015',
        },
        // Warm success green
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Warm danger
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Warm neutral grays
        warm: {
          50: '#FAF8F5',
          100: '#F5F0E8',
          200: '#EBE4D8',
          300: '#D9CFBF',
          400: '#C4B8A5',
          500: '#A69882',
          600: '#8A7B66',
          700: '#6E614F',
          800: '#534940',
          900: '#3A332D',
          950: '#201D19',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Georgia', 'serif'],
      },
      boxShadow: {
        'warm': '0 1px 3px 0 rgba(6, 78, 59, 0.08), 0 1px 2px 0 rgba(6, 78, 59, 0.04)',
        'warm-md': '0 4px 6px -1px rgba(6, 78, 59, 0.08), 0 2px 4px -1px rgba(6, 78, 59, 0.04)',
        'warm-lg': '0 10px 15px -3px rgba(6, 78, 59, 0.08), 0 4px 6px -2px rgba(6, 78, 59, 0.04)',
        'warm-xl': '0 20px 25px -5px rgba(6, 78, 59, 0.1), 0 10px 10px -5px rgba(6, 78, 59, 0.04)',
        'glow': '0 0 20px rgba(205, 158, 98, 0.25)',
      },
      backgroundImage: {
        'warm-gradient': 'linear-gradient(135deg, #FAF8F5 0%, #F5F0E8 100%)',
        'accent-gradient': 'linear-gradient(135deg, #CD9E62 0%, #97623B 100%)',
        'primary-gradient': 'linear-gradient(135deg, #059669 0%, #064e3b 100%)',
      },
    },
  },
  plugins: [],
};
export default config;

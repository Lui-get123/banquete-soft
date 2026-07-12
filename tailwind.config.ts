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
        // Warm maroon primary — inspired by the boleta
        primary: {
          50: '#fdf2f4',
          100: '#fce7eb',
          200: '#f9d0d9',
          300: '#f4a9b8',
          400: '#ec7a93',
          500: '#e04d6f',
          600: '#8B2252',
          700: '#7A1E48',
          800: '#661A3D',
          900: '#5B1636',
          950: '#330C1E',
        },
        // Warm gold accent
        accent: {
          50: '#FFFBF0',
          100: '#FFF5DB',
          200: '#FFE9B3',
          300: '#FFDA80',
          400: '#FFC94D',
          500: '#D4A843',
          600: '#B8922F',
          700: '#9A7A25',
          800: '#7C631E',
          900: '#5E4A16',
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
        'warm': '0 1px 3px 0 rgba(91, 22, 54, 0.08), 0 1px 2px 0 rgba(91, 22, 54, 0.04)',
        'warm-md': '0 4px 6px -1px rgba(91, 22, 54, 0.08), 0 2px 4px -1px rgba(91, 22, 54, 0.04)',
        'warm-lg': '0 10px 15px -3px rgba(91, 22, 54, 0.08), 0 4px 6px -2px rgba(91, 22, 54, 0.04)',
        'warm-xl': '0 20px 25px -5px rgba(91, 22, 54, 0.1), 0 10px 10px -5px rgba(91, 22, 54, 0.04)',
        'glow': '0 0 20px rgba(212, 168, 67, 0.15)',
      },
      backgroundImage: {
        'warm-gradient': 'linear-gradient(135deg, #FAF8F5 0%, #F5F0E8 100%)',
        'accent-gradient': 'linear-gradient(135deg, #D4A843 0%, #B8922F 100%)',
        'primary-gradient': 'linear-gradient(135deg, #8B2252 0%, #5B1636 100%)',
      },
    },
  },
  plugins: [],
};
export default config;


/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#0D7377', // Deep Teal
          dark: '#0A5C5F',
          light: '#149196',
        },
        accent: {
          DEFAULT: '#E8A838', // Warm Amber
          hover: '#D69526',
        },
        danger: {
          DEFAULT: '#C62828',
          hover: '#B71C1C',
        },
        success: {
          DEFAULT: '#2E7D32',
          hover: '#1B5E20',
        },
        background: {
          light: '#F7F8FA',
          dark: '#111827',
        },
        text: {
          light: '#1E293B',
          dark: '#F1F5F9',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 15px rgba(13, 115, 119, 0.3)',
      }
    },
  },
  plugins: [],
}

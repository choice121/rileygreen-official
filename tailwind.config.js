/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdf9ee',
          100: '#f9efcc',
          200: '#f2dc95',
          300: '#e8c558',
          400: '#dba930',
          500: '#c9a84c',
          600: '#b8901a',
          700: '#9a7217',
          800: '#7e5c19',
          900: '#6a4c1a',
        },
        dark: {
          50: '#f0f0f5',
          100: '#d5d5e8',
          200: '#a8a8cc',
          300: '#7070a8',
          400: '#454580',
          500: '#252540',
          600: '#1a1a30',
          700: '#13131f',
          800: '#0d0d14',
          900: '#08080c',
        },
        cream: '#F0EAD6',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Oswald', 'Impact', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #c9a84c 0%, #e8c558 50%, #c9a84c 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0d0d14 0%, #13131f 100%)',
        'hero-gradient': 'linear-gradient(to bottom, rgba(13,13,20,0.3) 0%, rgba(13,13,20,0.7) 60%, rgba(13,13,20,1) 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.8s ease-out forwards',
        'fade-in': 'fadeIn 1s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'gold': '0 0 30px rgba(201, 168, 76, 0.2)',
        'gold-lg': '0 0 60px rgba(201, 168, 76, 0.3)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}

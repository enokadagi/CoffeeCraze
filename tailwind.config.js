/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4A2E1F',
        secondary: '#2B1A12',
        accent: '#C78A47',
        'accent-light': '#F0D7B0',
        background: '#F8F4EE',
        surface: '#FFFDF9',
        cream: '#F8F4EE',
        'palette-b-light': '#F5F1EB',
        espresso: '#2B1A12',
        caramel: '#C78A47',
        mocha: '#4A2E1F',
        border: '#D8C9B9',
        'caramel-gold': '#C78A47',
        gold: {
          DEFAULT: '#C78A47',
          50: '#FEF7EF',
          100: '#FDF0DF',
          200: '#FBE0BF',
          300: '#F9D0A0',
          400: '#C78A47',
          500: '#C78A47',
          600: '#A87439',
          700: '#8A5E2B',
          800: '#6C4820',
          900: '#4E3215',
        },
        walnut: '#22150F',
        coffee: {
          DEFAULT: '#22150F',
          50: '#F8F4EE',
          100: '#EFE6D8',
          200: '#E4D2BC',
          300: '#D8B397',
          400: '#C78A47',
          500: '#B07A44',
          600: '#4A2E1F',
          700: '#3B2414',
          800: '#2B1A12',
          900: '#22150F',
          950: '#1A0F0A',
        },
      },
      fontSize: {
        // Fluid typography system - scales responsively
        'fluid-hero': ['clamp(2.5rem, 8vw, 4rem)', { lineHeight: '1.1' }],
        'fluid-heading': ['clamp(2rem, 6vw, 3.5rem)', { lineHeight: '1.2' }],
        'fluid-title': ['clamp(1.5rem, 4vw, 2.5rem)', { lineHeight: '1.3' }],
        'fluid-subtitle': ['clamp(1.25rem, 3vw, 1.875rem)', { lineHeight: '1.4' }],
        'fluid-body': ['clamp(1rem, 2vw, 1.125rem)', { lineHeight: '1.6' }],
        'fluid-small': ['clamp(0.875rem, 1.5vw, 1rem)', { lineHeight: '1.5' }],
        'fluid-label': ['clamp(0.75rem, 1.2vw, 0.875rem)', { lineHeight: '1.4' }],
      },
      letterSpacing: {
        tightest: '-0.05em',
      },
      boxShadow: {
        premium: '0 12px 34px rgba(0, 0, 0, 0.12)',
        'premium-lg': '0 20px 60px rgba(0, 0, 0, 0.16)',
        'premium-xl': '0 28px 90px rgba(0, 0, 0, 0.20)',
      },
      fontFamily: {
        sans: ['Google Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Google Sans', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Google Sans', 'Georgia', 'serif'],
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.7' },
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

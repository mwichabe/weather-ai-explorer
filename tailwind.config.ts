import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        cosmos: {
          950: '#05070f',
          900: '#070b1a',
          850: '#0a1024',
          800: '#0d1430',
          700: '#141d45',
          600: '#1d2960',
        },
        nebula: {
          violet: '#8b7cf6',
          indigo: '#5d6cfa',
          cyan: '#58c7f3',
          rose: '#f0719b',
        },
      },
      boxShadow: {
        glass: '0 8px 32px rgba(3, 6, 18, 0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
        glow: '0 0 40px rgba(139, 124, 246, 0.25)',
      },
      animation: {
        'aurora-a': 'auroraA 26s ease-in-out infinite alternate',
        'aurora-b': 'auroraB 32s ease-in-out infinite alternate',
        'aurora-c': 'auroraC 38s ease-in-out infinite alternate',
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-soft': 'pulseSoft 4s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
      },
      keyframes: {
        auroraA: {
          '0%': { transform: 'translate(-12%, -6%) scale(1)' },
          '100%': { transform: 'translate(10%, 8%) scale(1.18)' },
        },
        auroraB: {
          '0%': { transform: 'translate(14%, 4%) scale(1.1)' },
          '100%': { transform: 'translate(-8%, -10%) scale(0.95)' },
        },
        auroraC: {
          '0%': { transform: 'translate(0%, 12%) scale(1)' },
          '100%': { transform: 'translate(6%, -8%) scale(1.22)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

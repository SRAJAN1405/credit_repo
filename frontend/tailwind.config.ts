import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f9f5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#0a0e27',
        },
        accent: {
          purple: '#a78bfa',
          indigo: '#818cf8',
          blue: '#60a5fa',
          emerald: '#10b981',
          amber: '#f59e0b',
          red: '#ef4444',
          pink: '#ec4899',
          cyan: '#06b6d4',
        },
      },
      backgroundColor: {
        base: '#0d0d1a',
        surface: '#13131f',
        'surface-light': '#1a1a2e',
        card: '#11111d',
        hover: 'rgba(255, 255, 255, 0.05)',
      },
      borderColor: {
        base: '#1e2035',
        light: 'rgba(255, 255, 255, 0.1)',
        lighter: 'rgba(255, 255, 255, 0.05)',
      },
      textColor: {
        base: '#e2e8f0',
        muted: '#94a3b8',
        'muted-dark': '#64748b',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        'glow-sm': '0 0 20px rgba(168, 85, 247, 0.15)',
        glow: '0 0 30px rgba(168, 85, 247, 0.25)',
        'glow-lg': '0 0 40px rgba(168, 85, 247, 0.35)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 8px 16px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      gridTemplateColumns: {
        'auto-fill': 'repeat(auto-fill, minmax(300px, 1fr))',
        'auto-fit': 'repeat(auto-fit, minmax(300px, 1fr))',
      },
      spacing: {
        gutter: 'var(--spacing-gutter)',
      },
    },
  },
  plugins: [],
} satisfies Config;

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./client/index.html', './client/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // OKLCH wrapper pattern - values in CSS, wrapper in Tailwind
        primary: {
          DEFAULT: 'oklch(var(--primary))',
          foreground: 'oklch(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary))',
          foreground: 'oklch(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent))',
          foreground: 'oklch(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive))',
          foreground: 'oklch(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'oklch(var(--success))',
          foreground: 'oklch(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'oklch(var(--warning))',
          foreground: 'oklch(var(--warning-foreground))',
        },
        background: 'oklch(var(--background))',
        foreground: 'oklch(var(--foreground))',
        card: {
          DEFAULT: 'oklch(var(--card))',
          foreground: 'oklch(var(--card-foreground))',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted))',
          foreground: 'oklch(var(--muted-foreground))',
        },
        border: 'oklch(var(--border))',
        input: 'oklch(var(--input))',
        ring: 'oklch(var(--ring))',
        // Neural theme special colors
        neural: {
          pink: 'oklch(var(--neural-pink))',
          blue: 'oklch(var(--neural-blue))',
          cyan: 'oklch(var(--neural-cyan))',
          gold: 'oklch(var(--neural-gold))',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        glow: '0 0 20px oklch(0.65 0.25 290 / 0.3)',
        'glow-lg': '0 0 40px oklch(0.65 0.25 290 / 0.4)',
        'glow-pink': '0 0 20px oklch(0.70 0.22 330 / 0.3)',
        'glow-success': '0 0 20px oklch(0.72 0.20 145 / 0.3)',
      },
      animation: {
        'neural-pulse': 'neural-pulse 3s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-scale': 'fade-in-scale 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float-orb 15s ease-in-out infinite',
      },
      keyframes: {
        'neural-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px oklch(0.65 0.25 290 / 0.3)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 40px oklch(0.65 0.25 290 / 0.5)',
            transform: 'scale(1.02)',
          },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float-orb': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(20px, -30px)' },
          '50%': { transform: 'translate(-10px, 20px)' },
          '75%': { transform: 'translate(15px, 10px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-neural': 'linear-gradient(135deg, oklch(0.65 0.25 290 / 0.1), oklch(0.70 0.22 330 / 0.1))',
      },
    },
  },
  plugins: [],
};

export default config;

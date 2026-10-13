import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: [
          'var(--font-poppins)',
          'Poppins',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        poppins: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
        condensed: ['var(--font-roboto-condensed)', '"Roboto Condensed"', 'sans-serif'],
      },
      colors: {
        // Layout & Surfaces
        border: {
          DEFAULT: 'hsl(var(--border))',
          subtle: 'hsl(var(--border-subtle))',
          hover: 'hsl(var(--border-hover))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: {
          DEFAULT: 'hsl(var(--background))',
          subtle: 'hsl(var(--surface-elevated))',
          muted: 'hsl(var(--muted))',
        },
        foreground: 'hsl(var(--foreground))',
        surface: {
          DEFAULT: 'hsl(var(--surface, var(--card)))',
          foreground: 'hsl(var(--surface-foreground, var(--card-foreground)))',
          elevated: 'hsl(var(--surface-elevated, var(--popover)))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
          elevated: 'hsl(var(--surface-elevated, var(--popover)))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        // Text Semantics
        text: {
          primary: 'hsl(var(--text-primary, var(--foreground)))',
          secondary: 'hsl(var(--text-secondary))',
          muted: 'hsl(var(--text-muted, var(--muted-foreground)))',
          inverse: 'hsl(var(--text-inverse))',
        },

        // Brand Tokens (Woofskis Identity: Dark Green & Bright Lime)
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          hover: 'hsl(var(--primary-hover))',
          active: 'hsl(var(--primary-active))',
          soft: 'hsl(var(--primary-soft))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          hover: 'hsl(var(--secondary-hover))',
          active: 'hsl(var(--secondary-active))',
          soft: 'hsl(var(--secondary-soft))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          hover: 'hsl(var(--accent-hover))',
          active: 'hsl(var(--accent-active))',
          soft: 'hsl(var(--accent-soft))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        brand: {
          primary: 'hsl(var(--brand-primary, var(--primary)))',
          'primary-hover': 'hsl(var(--brand-primary-hover, var(--primary-hover)))',
          'primary-active': 'hsl(var(--brand-primary-active, var(--primary-active)))',
          secondary: 'hsl(var(--brand-secondary, var(--accent)))',
          'secondary-hover': 'hsl(var(--brand-secondary-hover, var(--accent-hover)))',
          'secondary-active': 'hsl(var(--brand-secondary-active, var(--accent-active)))',
          lime: 'hsl(var(--brand-lime, var(--accent)))',
          'lime-hover': 'hsl(var(--brand-lime-hover, var(--accent-hover)))',
          'lime-active': 'hsl(var(--brand-lime-active, var(--accent-active)))',
          'lime-soft': 'hsl(var(--brand-lime-soft, var(--accent-soft)))',
          subtle: 'hsl(var(--brand-subtle))',
          muted: 'hsl(var(--brand-muted))',
          border: 'hsl(var(--brand-border))',
          foreground: 'hsl(var(--brand-foreground, var(--primary-foreground)))',
          'foreground-secondary':
            'hsl(var(--brand-foreground-secondary, var(--accent-foreground)))',
        },

        // Semantic State Tokens
        success: {
          DEFAULT: 'hsl(var(--success))',
          hover: 'hsl(var(--success-hover))',
          active: 'hsl(var(--success-active))',
          soft: 'hsl(var(--success-soft))',
          foreground: 'hsl(var(--success-foreground))',
          border: 'hsl(var(--success-border))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          hover: 'hsl(var(--destructive-hover, var(--danger-hover)))',
          active: 'hsl(var(--destructive-active, var(--danger-active)))',
          soft: 'hsl(var(--destructive-soft, var(--danger-soft)))',
          foreground: 'hsl(var(--destructive-foreground))',
          border: 'hsl(var(--destructive-border, var(--danger-border)))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger, var(--destructive)))',
          hover: 'hsl(var(--danger-hover))',
          active: 'hsl(var(--danger-active))',
          soft: 'hsl(var(--danger-soft))',
          foreground: 'hsl(var(--danger-foreground, var(--destructive-foreground)))',
          border: 'hsl(var(--danger-border))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          hover: 'hsl(var(--warning-hover))',
          active: 'hsl(var(--warning-active))',
          soft: 'hsl(var(--warning-soft))',
          foreground: 'hsl(var(--warning-foreground))',
          border: 'hsl(var(--warning-border))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          hover: 'hsl(var(--info-hover))',
          active: 'hsl(var(--info-active))',
          soft: 'hsl(var(--info-soft))',
          foreground: 'hsl(var(--info-foreground))',
          border: 'hsl(var(--info-border))',
        },
      },
      borderRadius: {
        none: '0',
        xs: 'var(--radius-xs, 0.125rem)',
        sm: 'var(--radius-sm, 0.25rem)',
        md: 'var(--radius-md, 0.375rem)',
        lg: 'var(--radius-lg, var(--radius, 0.5rem))',
        xl: 'var(--radius-xl, 0.75rem)',
        '2xl': 'var(--radius-2xl, 1rem)',
        '3xl': 'var(--radius-3xl, 1.5rem)',
        full: 'var(--radius-full, 9999px)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        'glow-primary': 'var(--shadow-glow-primary)',
        'glow-accent': 'var(--shadow-glow-accent)',
        'glow-lime': 'var(--shadow-glow-lime)',
        'glow-success': 'var(--shadow-glow-success)',
        'glow-danger': 'var(--shadow-glow-danger)',
      },
      spacing: {
        'space-xs': '0.25rem', // 4px
        'space-sm': '0.5rem', // 8px
        'space-md': '1rem', // 16px
        'space-lg': '1.5rem', // 24px
        'space-xl': '2rem', // 32px
        'space-2xl': '3rem', // 48px
        'space-3xl': '4rem', // 64px
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

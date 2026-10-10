/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      screens: {
        xs: '480px',
        '3xl': '1680px',
      },
      colors: {
        bg: 'color-mix(in srgb, var(--bg) calc(<alpha-value> * 100%), transparent)',
        surface: 'color-mix(in srgb, var(--surface) calc(<alpha-value> * 100%), transparent)',
        surface2: 'color-mix(in srgb, var(--secondary) calc(<alpha-value> * 100%), transparent)',
        line: 'color-mix(in srgb, var(--line) calc(<alpha-value> * 100%), transparent)',
        ink: 'color-mix(in srgb, var(--text) calc(<alpha-value> * 100%), transparent)',
        ink2: 'color-mix(in srgb, var(--text-2) calc(<alpha-value> * 100%), transparent)',
        ink3: 'color-mix(in srgb, var(--text-3) calc(<alpha-value> * 100%), transparent)',
        accent: 'color-mix(in srgb, var(--accent) calc(<alpha-value> * 100%), transparent)',
        'accent-hover': 'color-mix(in srgb, var(--accent-hover) calc(<alpha-value> * 100%), transparent)',
        'accent-soft': 'color-mix(in srgb, var(--accent-soft) calc(<alpha-value> * 100%), transparent)',
        'on-accent': 'color-mix(in srgb, var(--on-accent) calc(<alpha-value> * 100%), transparent)',
        pass: 'color-mix(in srgb, var(--pass) calc(<alpha-value> * 100%), transparent)',
        borderline: 'color-mix(in srgb, var(--borderline) calc(<alpha-value> * 100%), transparent)',
        fail: 'color-mix(in srgb, var(--fail) calc(<alpha-value> * 100%), transparent)',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', '15px'],
        xs: ['12px', '17px'],
        sm: ['13px', '19px'],
        base: ['14px', '22px'],
        md: ['16px', '24px'],
        lg: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        xl: ['30px', { lineHeight: '36px', letterSpacing: '-0.03em' }],
        '2xl': ['36px', { lineHeight: '42px', letterSpacing: '-0.04em' }],
        '3xl': ['42px', { lineHeight: '48px', letterSpacing: '-0.045em' }],
        '4xl': ['48px', { lineHeight: '52px', letterSpacing: '-0.05em' }],
        hero: ['56px', { lineHeight: '60px', letterSpacing: '-0.055em' }],
      },
      borderRadius: {
        DEFAULT: '7px',
        md: '7px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        glow: 'var(--focus-ring)',
        card: 'var(--shadow)',
        pop: 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
}

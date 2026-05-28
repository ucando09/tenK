/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // These change between dark ↔ light — use CSS variables
        'bg-deep':     'var(--bg-deep)',
        'bg-card':     'var(--bg-card)',
        'bg-surface':  'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        border:        'var(--color-border)',
        'border-dim':  'var(--border-dim)',
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        'text-dim':       'var(--text-dim)',

        // Brand / status colors — same in both themes (used with opacity modifiers)
        accent:         '#7c6cf0',
        'accent-glow':  'rgba(124,108,240,0.4)',
        'accent-light': '#9080ff',
        success:        '#28c840',
        warning:        '#f0c060',
        error:          '#e05555',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'accent-glow': '0 0 20px rgba(124, 108, 240, 0.4)',
        card:          '0 2px 16px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':  'spin 8s linear infinite',
      },
    },
  },
  plugins: [],
};

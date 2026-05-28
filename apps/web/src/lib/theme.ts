/**
 * Theme system — injects CSS variables as INLINE styles on <html>.
 *
 * Why inline styles instead of a CSS selector like html[data-theme='light']?
 * Inline styles have specificity [1,0,0,0] — the highest possible. They
 * override every stylesheet rule regardless of selector specificity, so
 * Tailwind utility classes (bg-bg-card, text-text-primary, etc.) correctly
 * reflect the active theme on every repaint.
 */

const THEMES = {
  dark: {
    '--bg-deep':               '#08081a',
    '--bg-card':               '#0d0d1f',
    '--bg-surface':            '#101026',
    '--bg-elevated':           '#12122a',
    '--color-border':          '#1e1e3a',
    '--border-dim':            '#14142a',
    '--text-primary':          '#ffffff',
    '--text-secondary':        '#cccccc',
    '--text-muted':            '#555555',
    '--text-dim':              '#2e2e52',
    '--scrollbar-track':       '#0d0d1f',
    '--scrollbar-thumb':       '#1e1e3a',
    '--scrollbar-thumb-hover': '#2e2e52',
  },
  light: {
    '--bg-deep':               '#f0f0f9',
    '--bg-card':               '#ffffff',
    '--bg-surface':            '#f8f8ff',
    '--bg-elevated':           '#ebebf8',
    '--color-border':          '#d8d8ee',
    '--border-dim':            '#e5e5f5',
    '--text-primary':          '#0a0a20',
    '--text-secondary':        '#2a2a4a',
    '--text-muted':            '#7070a0',
    '--text-dim':              '#b0b0cc',
    '--scrollbar-track':       '#f0f0f9',
    '--scrollbar-thumb':       '#d8d8ee',
    '--scrollbar-thumb-hover': '#c0c0e0',
  },
} as const;

export function applyTheme(theme: 'dark' | 'light'): void {
  const vars = THEMES[theme];
  const root = document.documentElement;
  (Object.entries(vars) as [string, string][]).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
}

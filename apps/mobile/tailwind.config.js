/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'media', // follows system color scheme via useColorScheme()
  theme: {
    extend: {
      colors: {
        // Dark theme colors (default / dark: prefix)
        'bg-deep':     '#08081a',
        'bg-card':     '#0d0d1f',
        'bg-surface':  '#101026',
        'bg-elevated': '#12122a',
        border:        '#1e1e3a',
        'border-dim':  '#14142a',
        'text-primary':   '#ffffff',
        'text-secondary': '#cccccc',
        'text-muted':     '#555555',
        'text-dim':       '#2e2e52',

        // Light theme equivalents — use with 'light-' prefix in JSX
        // e.g. className="bg-bg-card dark:bg-bg-card"  (swap defaults below when needed)
        'light-bg-deep':     '#f0f0f9',
        'light-bg-card':     '#ffffff',
        'light-bg-surface':  '#f8f8ff',
        'light-bg-elevated': '#ebebf8',
        'light-border':      '#d8d8ee',
        'light-text-primary':   '#0a0a20',
        'light-text-secondary': '#2a2a4a',
        'light-text-muted':     '#7070a0',
        'light-text-dim':       '#b0b0cc',

        // Brand / status — same in both themes
        accent:         '#7c6cf0',
        'accent-light': '#9080ff',
        success:        '#28c840',
        warning:        '#f0c060',
        error:          '#e05555',
      },
    },
  },
  plugins: [],
};

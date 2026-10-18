/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './assets/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0a0a0a',
        void: '#050505',
        graphite: '#111111',
        ash: '#181818',
        accent: '#8fe3ff',
        // Muted text token that still clears WCAG AA (4.5:1) on obsidian.
        mist: '#a1a1aa',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        widest2: '0.22em',
        widest3: '0.34em',
      },
      maxWidth: {
        shell: '1560px',
      },
      transitionTimingFunction: {
        cinematic: 'cubic-bezier(0.16, 1, 0.3, 1)',
        soft: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/shared/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          bg: 'var(--cp-bg)',
          surface: 'var(--cp-surface)',
          elevated: 'var(--cp-elevated)',
          border: 'var(--cp-border)',
          'border-subtle': 'var(--cp-border-subtle)',
          text: 'var(--cp-text)',
          'text-muted': 'var(--cp-text-muted)',
          'text-dim': 'var(--cp-text-dim)',
          cobalt: 'var(--cp-cobalt)',
          'cobalt-hover': 'var(--cp-cobalt-hover)',
          'cobalt-light': 'var(--cp-cobalt-light)',
          success: 'var(--cp-success)',
          'success-bg': 'var(--cp-success-bg)',
          warning: 'var(--cp-warning)',
          'warning-bg': 'var(--cp-warning-bg)',
          danger: 'var(--cp-danger)',
          'danger-bg': 'var(--cp-danger-bg)'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'card': '0 4px 12px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 12px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.04)'
      }
    },
  },
  plugins: [],
}

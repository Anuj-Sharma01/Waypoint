/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink:        '#0d2b1f',
        panel:      '#ffffff',
        border:     '#a5f3fc',
        accent:     '#34d399',
        accentDark: '#059669',
        sky:        '#38bdf8',
        skyDark:    '#0369a1',
        lavender:   '#a78bfa',
        lavDark:    '#6d28d9',
        muted:      '#94a3b8',
        dim:        '#4b7a6a',
        soft:       '#f0fdf9',
        softborder: '#a5f3fc',
        panel2:     '#e0f2fe',
        skybg:      '#eff6ff',
        mintbg:     '#ecfdf5',
        lavbg:      '#ede9fe',
      },
    }
  },
  plugins: []
}

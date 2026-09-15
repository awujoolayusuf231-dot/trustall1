/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1B1F3B',
        inksoft: '#2C3159',
        surface: '#FAF8F4',
        surfacealt: '#F1EEE6',
        hairline: '#E4DFD3',
        marigold: {
          DEFAULT: '#E8A33D',
          deep: '#C9821F',
          soft: '#F3C077',
        },
        seal: {
          DEFAULT: '#2F6E51',
          deep: '#1F4D38',
        },
        muted: '#6B6558',
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

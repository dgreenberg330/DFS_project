import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f0f1a',
          surface: '#1a1a2e',
          elevated: '#252540',
          border: '#2d2d4a',
        },
        accent: {
          DEFAULT: '#4fd1c5',
          light: '#81e6d9',
          dark: '#38b2ac',
        },
      },
    },
  },
  plugins: [],
}
export default config

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif KR"', '"조선일보명조체"', 'Georgia', 'serif'],
        myeongjo: ['"Noto Serif KR"', '"조선일보명조체"', 'serif'],
      },
      colors: {
        brand: {
          50:  '#eef4fb',
          100: '#d4e5f5',
          200: '#a9cceb',
          300: '#72aadc',
          400: '#4088ca',
          500: '#2a6bb3',
          600: '#1e4e8a',
          700: '#1a3f70',
          800: '#162f52',
          900: '#0f1f36',
        },
        paper: '#f8f7f2',
        gold: '#c8972a',
      },
      fontSize: {
        'app-sm': 'var(--app-font-size-sm)',
        'app-base': 'var(--app-font-size-base)',
        'app-lg': 'var(--app-font-size-lg)',
        'app-xl': 'var(--app-font-size-xl)',
      },
    },
  },
  plugins: [],
};
export default config;

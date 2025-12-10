import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#cfae45',
          500: '#b89b3b',
          600: '#a78b34',
          700: '#8a7429',
          800: '#6b5a20',
          900: '#4a3d16',
        },
        midnight: {
          50: '#f0f3f8',
          100: '#d4dce9',
          200: '#a9b9d4',
          300: '#7d95be',
          400: '#5272a9',
          500: '#2d4a7c',
          600: '#1e3a5f',
          700: '#162c49',
          800: '#0f1e33',
          900: '#080f1c',
          950: '#040810',
        }
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'gradient': 'gradient 8s ease infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(207, 174, 69, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(207, 174, 69, 0.6)' },
        },
      },
      backgroundSize: {
        '300%': '300%',
      },
    },
  },
  plugins: [],
};

export default config;


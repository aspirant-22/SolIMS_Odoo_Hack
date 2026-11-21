/**
 * @AUTHOR: Garima Mittal
 * @FILE: tailwind.config.js
 * @RESPONSIBILITY: Configures Tailwind CSS design tokens for SolIMS Grid Forest-Emerald & Soft-Mint Design System.
 * @DEPENDENCIES: None
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        '2xs': '0 1px 1px 0 rgb(0 0 0 / 0.03)',
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card': '0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px -14px rgb(15 23 42 / 0.16)',
        'lift': '0 2px 4px rgb(15 23 42 / 0.05), 0 22px 44px -18px rgb(15 23 42 / 0.32)',
        'glow': '0 0 0 4px rgb(245 158 11 / 0.18), 0 12px 28px -8px rgb(19 93 59 / 0.45)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 1.2s infinite',
      },
      colors: {
        solims: {
          forest: '#135D3B',
          forestHover: '#0E462C',
          forestDeep: '#0F291E',
          mintCanvas: '#F4F9F6',
          mintLight: '#EBF5EE',
          mintPill: '#E6F4EC',
          amber: '#F59E0B',
          amberDark: '#D97706',
        },
        odoo: {
          primary: '#135D3B',      // Unified SolIMS Forest Emerald
          primaryDark: '#0E462C',
          secondary: '#135D3B',
          secondaryDark: '#0E462C',
          purple: '#135D3B',
          grayBg: '#F4F9F6',
          border: '#E2E8F0',
          darkText: '#0F291E',
          mutedText: '#64748B'
        },
        solar: {
          amber: '#F59E0B',
          gold: '#D97706',
          sky: '#0EA5E9',
          leaf: '#135D3B'
        }
      }
    },
  },
  plugins: [],
};

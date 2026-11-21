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
      boxShadow: {
        '2xs': '0 1px 1px 0 rgb(0 0 0 / 0.03)',
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
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

/**
 * @AUTHOR: Garima Mittal
 * @FILE: tailwind.config.js
 * @RESPONSIBILITY: Configures Tailwind CSS design tokens, Odoo brand palette, and content scan paths.
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
      colors: {
        odoo: {
          primary: '#714B67',      // Signature Odoo Aubergine
          primaryDark: '#56384e',
          secondary: '#008784',    // Odoo Teal
          secondaryDark: '#006d6a',
          purple: '#875A7B',
          grayBg: '#F8F9FA',
          border: '#E2E8F0',
          darkText: '#212529',
          mutedText: '#6C757D'
        },
        solar: {
          amber: '#F59E0B',
          gold: '#D97706',
          sky: '#0EA5E9',
          leaf: '#10B981'
        }
      }
    },
  },
  plugins: [],
};

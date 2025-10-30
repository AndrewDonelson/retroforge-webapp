/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // RetroForge color palette
        retro: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Retro game colors
        pixel: {
          black: '#000000',
          white: '#ffffff',
          red: '#ff0000',
          green: '#00ff00',
          blue: '#0000ff',
          yellow: '#ffff00',
          cyan: '#00ffff',
          magenta: '#ff00ff',
        }
      },
      fontFamily: {
        'pixel': ['Press Start 2P', 'monospace'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pixel-bounce': 'pixel-bounce 0.5s ease-in-out',
        'pixel-glow': 'pixel-glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pixel-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'pixel-glow': {
          '0%': { boxShadow: '0 0 5px #0ea5e9' },
          '100%': { boxShadow: '0 0 20px #0ea5e9, 0 0 30px #0ea5e9' },
        },
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(18px)', filter: 'blur(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        'card-in': {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(0.985)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        kenburns: {
          '0%': { transform: 'scale(1.02) translate3d(0,0,0)' },
          '100%': { transform: 'scale(1.12) translate3d(-1.5%,-1%,0)' },
        },
        shine: {
          '0%': { transform: 'translateX(0) skewX(-12deg)', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { transform: 'translateX(420%) skewX(-12deg)', opacity: '0' },
        },
        orb: {
          '0%, 100%': { transform: 'translate(0,0)' },
          '50%': { transform: 'translate(40px,30px)' },
        },
        line: {
          '0%': { opacity: '0', transform: 'translateY(100%)', clipPath: 'inset(0 0 100% 0)' },
          '100%': { opacity: '1', transform: 'translateY(0)', clipPath: 'inset(0 0 0 0)' },
        },
      },
      animation: {
        rise: 'rise 0.9s cubic-bezier(0.22,1,0.36,1) both',
        'card-in': 'card-in 0.9s cubic-bezier(0.22,1,0.36,1) both',
        line: 'line 0.9s cubic-bezier(0.22,1,0.36,1) both',
        kenburns: 'kenburns 18s ease-in-out infinite alternate',
        shine: 'shine 7s ease-in-out infinite',
        orb: 'orb 14s ease-in-out infinite',
        'orb-slow': 'orb 20s ease-in-out infinite reverse',
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
  "./index.html",
  "./main.tsx",
  "./**/*.{js,ts,jsx,tsx}",
],
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      mono: ['"JetBrains Mono"', 'monospace'],
    },
    colors: {
      brand: {
        50: '#f4f7fa',
        100: '#eef2f6',
        500: '#3b82f6',
        600: '#2563eb',
        900: '#0f172a',
      },
    },
  },
},
  // theme: {
  //   extend: {
  //   fontFamily: {
  //     sans: ['Inter', 'sans-serif'],
  //     mono: ['"JetBrains Mono"', 'monospace'],
  //   },
  // },
  // },
  plugins: [],
}

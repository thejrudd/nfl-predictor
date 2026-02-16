/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Try these options by changing 'display' font:
        // 'Oswald' - Bold, slightly condensed, very readable
        // 'Barlow Condensed' - Clean, modern, professional
        // 'Rajdhani' - Geometric, bold, futuristic
        // 'Teko' - Very condensed, NFL Network style
        // 'Anton' - Super bold, impact style
        'display': ['"Barlow Condensed"', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


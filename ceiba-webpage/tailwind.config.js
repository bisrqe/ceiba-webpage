/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ceiba: {
          pink: '#DB5D9C',
          rose: '#D885B5',
          green: '#3A6C28',
          mint: '#CDF0C2',
          yellow: '#EEE375',
          blue: '#C1E7F8',
          brown: '#A6866C',
          ink: '#181B16',
          cream: '#F5F5F1',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Poppins"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

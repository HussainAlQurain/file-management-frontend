/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  safelist: [
    'bg-primary', 
    'text-primary', 
    /^mat-.*/
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

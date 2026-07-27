/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1B1512",       // near-black espresso
        crown: {
          50: "#FBF7F2",
          100: "#F3EAE0",
          200: "#E6D4BF",
          300: "#D4B58C",
          400: "#C9A15E",     // warm gold — signature accent
          500: "#B4863F",
          600: "#8F6A31",
        },
        wine: {
          400: "#9A3F4C",
          500: "#7A2E3A",     // deep burgundy accent
          600: "#5C222B",
        },
        ivory: "#F6F1EA",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.28em",
      },
    },
  },
  plugins: [],
};

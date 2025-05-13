/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Spring floral color palette inspired by the bouquet
        primary: {
          light: "#FFE5B4", // Light peach
          DEFAULT: "#FF9A76", // Coral/peach
          dark: "#E67E5A", // Deeper coral
        },
        secondary: {
          light: "#A7D8FF", // Light blue
          DEFAULT: "#6BBBFF", // Sky blue
          dark: "#4A9FE8", // Deeper blue
        },
        accent: {
          light: "#FFF9C4", // Light yellow
          DEFAULT: "#FFEB3B", // Yellow
          dark: "#FBC02D", // Deeper yellow
        },
        green: {
          light: "#C8E6C9", // Light green
          DEFAULT: "#81C784", // Medium green
          dark: "#4CAF50", // Deeper green
        },
        blush: "#FFD1DC",
        cream: "#FFFDD0",
        ivory: "#FFFFF0",
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Montserrat", "Helvetica", "Arial", "sans-serif"],
        script: ["Great Vibes", "cursive"],
      },
      backgroundImage: {
        "floral-pattern": "url('/images/floral-bg.png')",
      },
      boxShadow: {
        elegant: "0 4px 20px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};

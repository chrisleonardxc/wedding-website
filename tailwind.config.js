/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Carolina blue and white as primary colors
        primary: {
          light: "#A7D8FF", // Light Carolina blue
          DEFAULT: "#4B9CD3", // Carolina blue
          dark: "#13294B", // Navy blue (UNC colors)
        },
        secondary: {
          light: "#FFE5E5", // Light pink
          DEFAULT: "#FF9A8B", // Coral/salmon pink
          dark: "#E67E76", // Deeper coral
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
        purple: {
          light: "#E1BEE7", // Light purple
          DEFAULT: "#9C27B0", // Medium purple
          dark: "#7B1FA2", // Deep purple
        },
        blush: "#FFD1DC",
        cream: "#FFFDD0",
        ivory: "#FFFFF0",
        white: "#FFFFFF",
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

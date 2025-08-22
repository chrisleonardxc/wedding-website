/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Carolina blue as primary color
        primary: {
          light: "#A7D8FF", // Light Carolina blue
          DEFAULT: "#4B9CD3", // Carolina blue
          dark: "#13294B", // Navy blue (UNC colors)
        },
        // Light green as secondary color (similar to Benjamin Moore Stokes Forest Green)
        secondary: {
          light: "#B8D4B8", // Very light green
          DEFAULT: "#7BA05B", // Stokes Forest Green inspired
          dark: "#5A7A43", // Darker green
        },
        // Keep white variants
        white: "#FFFFFF",
        ivory: "#FFFFF0", // Keep for subtle background variation
        
        // Remove all other colors - they'll fall back to Tailwind defaults if needed
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

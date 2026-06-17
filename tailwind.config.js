/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#343230",
        pencil: "#4a4742",
        paper: "#f7d982",
        cream: "#fff4c7",
        moss: "#55745d",
        amber: "#c07f2d",
        brick: "#a14f3d",
        sky: "#d8e6df",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(52, 50, 48, 0.14)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

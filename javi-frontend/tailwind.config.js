/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      overflow: {
        overlay: "overlay",
      },
      scrollbarGutter: {
        stable: "stable",
      },
      fontFamily: {
        sans: [
          "Inter", // chính
          "Noto Sans JP", // tiếng Nhật
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

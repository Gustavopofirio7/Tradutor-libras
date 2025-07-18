/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Isso diz ao Tailwind para escanear todos os seus arquivos React na pasta src
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'], // Adiciona a fonte Inter, se quiser usá-la
      },
    },
  },
  plugins: [],
}

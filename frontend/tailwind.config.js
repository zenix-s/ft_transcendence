/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
	  "./index.html",              // el index principal
	  "./src/**/*.{js,ts,jsx,tsx}" // todos tus ficheros TS/JS dentro de src
	],
	darkMode: ["class"], // 👈 activamos modo oscuro por clase (no por media query)
	theme: {
	  extend: {},
	},
	plugins: [],
  };
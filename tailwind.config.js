/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
		colors: {
			"mainBackgroundColor": '#0D1117',
			"columnBackgroundColor": '#161C22'
		}
	},
  },
  plugins: [],
}


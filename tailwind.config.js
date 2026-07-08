export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        income: '#22c55e',
        expense: '#f43f5e',
        invest: '#8b5cf6',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

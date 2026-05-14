/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 自定义暗色主题扩展
        surface: {
          DEFAULT: '#1f2937',
          hover: '#374151',
        },
      },
    },
  },
  plugins: [],
};

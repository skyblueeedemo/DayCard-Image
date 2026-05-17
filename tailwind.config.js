/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── 设计 Token（接入 src/assets/index.css 的 CSS 变量） ───
        brand: {
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          hover: 'rgb(var(--color-brand-hover) / <alpha-value>)',
          fg: 'rgb(var(--color-brand-fg) / <alpha-value>)',
        },
        'surface-0': 'rgb(var(--color-surface-0) / <alpha-value>)',
        'surface-1': 'rgb(var(--color-surface-1) / <alpha-value>)',
        'surface-2': 'rgb(var(--color-surface-2) / <alpha-value>)',
        'border-default': 'rgb(var(--color-border) / <alpha-value>)',
        'border-subtle': 'rgb(var(--color-border-subtle) / <alpha-value>)',
        fg: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
        // 状态色（语义保留，不属于品牌色）
        'status-success': 'rgb(var(--color-success) / <alpha-value>)',
        'status-warning': 'rgb(var(--color-warning) / <alpha-value>)',
        'status-danger': 'rgb(var(--color-danger) / <alpha-value>)',
        'status-info': 'rgb(var(--color-info) / <alpha-value>)',

        // ─── 旧别名（保留向后兼容；阶段三完成后可清理） ───
        surface: {
          DEFAULT: '#1f2937',
          hover: '#374151',
        },
      },
      keyframes: {
        'page-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'page-in': 'page-in 150ms ease-out',
        'toast-in': 'toast-in 200ms ease-out',
      },
    },
  },
  plugins: [],
};

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './assets/index.css';
import { bootstrapProviders } from './providers/bootstrap';

// 确保默认暗夜模式 — 在 React 渲染前立即设置
document.documentElement.classList.add('dark');

bootstrapProviders();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

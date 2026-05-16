import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

const LS_KEY = 'daycard-appearance';

function getStoredAppearance(): 'dark' | 'light' {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch { /* ignore */ }
  return 'dark';
}

function syncClass(appearance: 'dark' | 'light'): void {
  const root = document.documentElement;
  if (appearance === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function useAppearance(): void {
  const appearance = useSettingsStore((s) => s.appearance);

  // 渲染期间立即同步（防止闪烁）— 优先 localStorage，其次 store
  syncClass(getStoredAppearance() === 'dark' ? 'dark' : appearance);

  useEffect(() => {
    // 以 store 值为准，同时写回 localStorage
    syncClass(appearance);
    try { localStorage.setItem(LS_KEY, appearance); } catch { /* ignore */ }
  }, [appearance]);
}

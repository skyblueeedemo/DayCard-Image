import { useState, useEffect } from 'react';

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 也监听主进程的更可靠探活结果
    const unsub = window.electronAPI?.onEvent('network:status-changed', (data) => {
      if (typeof data === 'object' && data && 'online' in data) {
        setIsOnline((data as { online: boolean }).online);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsub?.();
    };
  }, []);

  return isOnline;
}

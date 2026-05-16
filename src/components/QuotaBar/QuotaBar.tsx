import { useState, useEffect, useCallback } from 'react';
import type { QuotaInfo } from '@/providers/IImageProvider';
import { providerManager } from '@/providers/ProviderManager';
import { useGenerationStore } from '@/store/generationStore';

function getBarColor(ratio: number): string {
  if (ratio >= 1) return 'bg-red-600';
  if (ratio > 0.75) return 'bg-red-500';
  if (ratio > 0.5) return 'bg-yellow-500';
  return 'bg-green-500';
}

export default function QuotaBar() {
  const activeProviderId = useGenerationStore((s) => s.activeProviderId);
  const activeModelId = useGenerationStore((s) => s.activeModelId);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!activeProviderId) {
      setQuota(null);
      return;
    }
    setLoading(true);
    try {
      // 优先从主进程 QuotaService 读取真实配额
      if (activeModelId && window.electronAPI?.getModelQuota) {
        const res = await window.electronAPI.getModelQuota({
          providerId: activeProviderId,
          modelId: activeModelId,
        });
        if (res.status === 'ok' && res.data) {
          setQuota(res.data);
          return;
        }
      }
      if (window.electronAPI?.getQuota) {
        const res = await window.electronAPI.getQuota(activeProviderId);
        if (res.status === 'ok' && res.data) {
          setQuota(res.data);
          return;
        }
      }
      // Web 模式：降级到前端 Provider
      const q = await providerManager.getQuota(activeProviderId);
      setQuota(q);
    } catch {
      setQuota(null);
    } finally {
      setLoading(false);
    }
  }, [activeProviderId, activeModelId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!activeProviderId || !quota || loading) {
    return null;
  }

  const ratio = quota.total > 0 ? quota.used / quota.total : 0;
  const pct = Math.round(ratio * 100);
  const isExhausted = quota.total !== Infinity && quota.used >= quota.total;

  return (
    <div className="w-full max-w-2xl flex items-center gap-3 text-xs">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(ratio)}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className={`whitespace-nowrap ${isExhausted ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
        {activeModelId && (
          <span className="text-gray-400 dark:text-gray-500 mr-1">{activeModelId}</span>
        )}
        {quota.used} / {quota.total === Infinity ? '∞' : quota.total}
        {isExhausted && (
          <span className="ml-1 text-red-500">已耗尽</span>
        )}
      </span>
    </div>
  );
}

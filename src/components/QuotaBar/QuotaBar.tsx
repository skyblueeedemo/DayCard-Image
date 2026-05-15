import { useState, useEffect, useCallback } from 'react';
import type { QuotaInfo } from '@/providers/IImageProvider';
import { providerManager } from '@/providers/ProviderManager';
import { useGenerationStore } from '@/store/generationStore';

function getBarColor(ratio: number): string {
  if (ratio > 0.5) return 'bg-green-500';
  if (ratio > 0.2) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function QuotaBar() {
  const activeProviderId = useGenerationStore((s) => s.activeProviderId);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!activeProviderId) {
      setQuota(null);
      return;
    }
    setLoading(true);
    try {
      const q = await providerManager.getQuota(activeProviderId);
      setQuota(q);
    } catch {
      setQuota(null);
    } finally {
      setLoading(false);
    }
  }, [activeProviderId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!activeProviderId || !quota || loading) {
    return null;
  }

  const ratio = quota.total > 0 ? quota.used / quota.total : 0;
  const pct = Math.round(ratio * 100);

  return (
    <div className="w-full max-w-2xl flex items-center gap-3 text-xs">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(ratio)}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="text-gray-400 whitespace-nowrap">
        {quota.used} / {quota.total === Infinity ? '∞' : quota.total}
      </span>
    </div>
  );
}

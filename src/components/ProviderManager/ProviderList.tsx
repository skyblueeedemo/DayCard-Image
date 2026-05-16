import { useState, useEffect, useCallback } from 'react';
import type { IImageProvider, QuotaInfo } from '@/providers/IImageProvider';
import { providerManager } from '@/providers/ProviderManager';
import { useGenerationStore } from '@/store/generationStore';

export default function ProviderList() {
  const activeProviderId = useGenerationStore((s) => s.activeProviderId);
  const setActiveProvider = useGenerationStore((s) => s.setActiveProvider);
  const [providers, setProviders] = useState<IImageProvider[]>([]);
  const [quotas, setQuotas] = useState<Record<string, QuotaInfo>>({});
  const [availability, setAvailability] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async () => {
    const list = providerManager.listProviders();
    setProviders(list);

    const q: Record<string, QuotaInfo> = {};
    if (window.electronAPI?.getAllQuotas) {
      const res = await window.electronAPI.getAllQuotas();
      if (res.status === 'ok' && res.data) {
        const data = res.data as Record<string, QuotaInfo>;
        for (const [k, v] of Object.entries(data)) {
          q[k] = v;
        }
      }
    } else {
      const allQuotas = await providerManager.getAllQuotas();
      allQuotas.forEach((v, k) => { q[k] = v; });
    }
    setQuotas(q);

    // Electron 模式：从 config 判断可用性
    const av: Record<string, boolean> = {};
    if (window.electronAPI?.getConfig) {
      try {
        const res = await window.electronAPI.getConfig();
        if (res.status === 'ok' && res.data) {
          const data = res.data as Record<string, unknown>;
          const providerData = (data.providers ?? data) as Record<string, { hasKey?: boolean }>;
          list.forEach((p) => {
            av[p.id] = providerData[p.id]?.hasKey ?? false;
          });
        }
      } catch {
        // fallback to HTTP
      }
    }
    if (Object.keys(av).length === 0) {
      await Promise.all(
        list.map(async (p) => {
          try { av[p.id] = await p.isAvailable(); } catch { av[p.id] = false; }
        }),
      );
    }
    setAvailability(av);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">已注册 Provider</h2>
        <button
          onClick={refresh}
          className="text-xs px-3 py-1 rounded border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
        >
          刷新
        </button>
      </div>

      {providers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">暂无已注册的 Provider</p>
          <p className="text-xs mt-1 text-gray-600">请检查 API Key 配置</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {providers.map((p) => {
            const avail = availability[p.id] ?? false;
            const quota = quotas[p.id];
            const isActive = p.id === activeProviderId;
            const ratio = quota && quota.total > 0 ? quota.used / quota.total : 0;

            return (
              <div
                key={p.id}
                className={`rounded-lg border p-4 transition-colors ${
                  isActive
                    ? 'border-blue-600 bg-blue-900/20'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${avail ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div>
                      <span className="text-sm font-medium text-gray-100">{p.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{p.id}</span>
                    </div>
                    <span className="text-xs text-gray-600 border border-gray-700 rounded px-1.5 py-0.5">
                      P{p.priority}
                    </span>
                  </div>

                  {!isActive && (
                    <button
                      onClick={() => setActiveProvider(p.id)}
                      className="text-xs px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                    >
                      切换
                    </button>
                  )}
                  {isActive && (
                    <span className="text-xs text-blue-400">当前</span>
                  )}
                </div>

                {quota && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          ratio > 0.5 ? 'bg-green-500' : ratio > 0.2 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(ratio * 100, 2)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {quota.used}/{quota.total === Infinity ? '∞' : quota.total}
                    </span>
                  </div>
                )}

                {!avail && (
                  <p className="mt-2 text-xs text-red-400">当前不可用</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

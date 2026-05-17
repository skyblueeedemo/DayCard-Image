import { useState, useEffect, useCallback } from 'react';
import type { IImageProvider } from '@/providers/IImageProvider';
import { providerManager } from '@/providers/ProviderManager';
import { useGenerationStore } from '@/store/generationStore';
import { loadOrder, loadModelOrder } from '@/utils/providerOrder';

interface ModelEntry {
  description?: string;
  remaining: number;
  total: number;
}

export default function ProviderSelector() {
  const activeProviderId = useGenerationStore((s) => s.activeProviderId);
  const activeModelId = useGenerationStore((s) => s.activeModelId);
  const setActiveProvider = useGenerationStore((s) => s.setActiveProvider);
  const setActiveModel = useGenerationStore((s) => s.setActiveModel);

  const [providers, setProviders] = useState<IImageProvider[]>([]);
  const [providerOrder, setProviderOrder] = useState<string[]>(() => loadOrder());
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<Record<string, ModelEntry>>({});
  const [modelOrder, setModelOrder] = useState<string[]>([]);
  const [showModels, setShowModels] = useState(false);

  const refresh = useCallback(async () => {
    const list = providerManager.listProviders();
    setProviders(list);
    // 每次刷新时重新读取排序，确保与 API 配置页同步
    const order = loadOrder();
    setProviderOrder(order);

    if (window.electronAPI?.getConfig) {
      try {
        const res = await window.electronAPI.getConfig();
        if (res.status === 'ok' && res.data) {
          const data = res.data as Record<string, unknown>;
          const providerData = (data.providers ?? data) as Record<string, { hasKey?: boolean }>;
          list.forEach((p) => {
            const hasKey = providerData[p.id]?.hasKey ?? false;
            setAvailability((prev) => ({ ...prev, [p.id]: hasKey || p.id === 'mock' }));
          });
          return;
        }
      } catch {
        // fall through to HTTP check
      }
    }

    list.forEach(async (p) => {
      try {
        const ok = await p.isAvailable();
        setAvailability((prev) => ({ ...prev, [p.id]: ok }));
      } catch {
        setAvailability((prev) => ({ ...prev, [p.id]: false }));
      }
    });
  }, []);

  const loadModels = useCallback(async () => {
    if (!window.electronAPI?.getConfig) return;
    try {
      const res = await window.electronAPI.getConfig();
      if (res.status === 'ok' && res.data) {
        const data = res.data as Record<string, unknown>;
        const providers = (data.providers ?? data) as Record<string, { models?: Record<string, ModelEntry> }> | undefined;
        if (providers?.aliyun?.models) {
          setModels(providers.aliyun.models);
          // 每次加载时重新读取模型排序，确保与 API 配置页同步
          setModelOrder(loadModelOrder('aliyun'));
        }
      }
    } catch {
      // 静默失败
    }
  }, []);

  useEffect(() => {
    refresh();
    loadModels();
    // 初始化时同步读取模型排序（不依赖 loadModels 的异步结果）
    setModelOrder(loadModelOrder('aliyun'));
  }, [refresh, loadModels]);

  // 初始化完成后，若 activeProviderId 为空，自动选中排序第一个可用的 Provider
  useEffect(() => {
    if (activeProviderId) return;
    if (providers.length === 0) return;

    const order = loadOrder();
    let sorted = providers;
    if (order.length > 0) {
      const indexMap = new Map(order.map((id, i) => [id, i]));
      sorted = [...providers].sort((a, b) => {
        const ai = indexMap.get(a.id) ?? 999;
        const bi = indexMap.get(b.id) ?? 999;
        return ai - bi;
      });
    }

    // 优先选第一个可用的（有 key 或 mock），否则选第一个
    const first = sorted.find((p) => availability[p.id] || p.id === 'mock') ?? sorted[0];
    if (first) {
      setActiveProvider(first.id);
    }
  }, [providers, availability, activeProviderId, setActiveProvider]);

  // 切换到阿里云且有模型列表时，若未选模型则自动选排序第一个
  useEffect(() => {
    if (activeProviderId !== 'aliyun') return;
    if (activeModelId) return;
    const modelKeys = Object.keys(models);
    if (modelKeys.length === 0) return;

    const order = loadModelOrder('aliyun');
    const sorted = order.length > 0
      ? [...modelKeys].sort((a, b) => {
          const ai = order.indexOf(a);
          const bi = order.indexOf(b);
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        })
      : modelKeys;

    if (sorted[0]) {
      setActiveModel(sorted[0]);
    }
  }, [activeProviderId, activeModelId, models, setActiveModel]);

  const sortedProviders = (() => {
    if (providerOrder.length === 0) return providers;
    const indexMap = new Map(providerOrder.map((id, i) => [id, i]));
    return [...providers].sort((a, b) => {
      const ai = indexMap.get(a.id) ?? 999;
      const bi = indexMap.get(b.id) ?? 999;
      return ai - bi;
    });
  })();

  const activeProvider = providers.find((p) => p.id === activeProviderId);
  const isAvailable = activeProviderId ? availability[activeProviderId] ?? false : false;
  const hasModels = activeProviderId === 'aliyun' && Object.keys(models).length > 0;
  const modelLabel = activeModelId ?? '选择模型';

  const btnClass = "flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 transition-colors";
  const dropdownClass = "absolute top-full mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl z-20";

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative">
        <button
          onClick={() => { setOpen(!open); refresh(); }}
          className={btnClass}
        >
          <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{activeProvider?.name ?? '选择模型服务'}</span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className={`${dropdownClass} w-64`}>
            {sortedProviders.map((p) => {
              const avail = availability[p.id] ?? false;
              return (
                <button
                  key={p.id}
                  onClick={() => { setActiveProvider(p.id); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    p.id === activeProviderId ? 'bg-gray-100 dark:bg-gray-700/50' : ''
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${avail ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="flex-1 text-gray-700 dark:text-gray-200">{p.name}</span>
                </button>
              );
            })}
            {sortedProviders.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">无可用模型服务</div>
            )}
          </div>
        )}

        {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
      </div>

      {hasModels && (
        <div className="relative">
          <button
            onClick={() => { setShowModels(!showModels); loadModels(); }}
            className={btnClass}
          >
            <span className="text-gray-500 dark:text-gray-400">{modelLabel}</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showModels ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showModels && (
            <div className={`${dropdownClass} w-72 max-h-80 overflow-y-auto`}>
              {(() => {
                const entries = Object.entries(models);
                const sorted = modelOrder.length > 0
                  ? [...entries].sort((a, b) => {
                      const ai = modelOrder.indexOf(a[0]);
                      const bi = modelOrder.indexOf(b[0]);
                      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
                    })
                  : entries;
                return sorted.map(([mid, info]) => (
                <button
                  key={mid}
                  onClick={() => { setActiveModel(mid); setShowModels(false); }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    mid === activeModelId ? 'bg-gray-100 dark:bg-gray-700/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-200">{mid}</span>
                    <span className={`text-xs font-mono ${info.remaining === 0 ? 'text-red-500' : info.remaining < 10 ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`}>
                      {info.remaining}/{info.total}
                    </span>
                  </div>
                  {info.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{info.description}</p>
                  )}
                </button>
              ));
            })()}
            </div>
          )}

          {showModels && <div className="fixed inset-0 z-10" onClick={() => setShowModels(false)} />}
        </div>
      )}
    </div>
  );
}

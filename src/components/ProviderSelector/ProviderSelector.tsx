import { useState, useEffect, useCallback } from 'react';
import type { IImageProvider } from '@/providers/IImageProvider';
import { providerManager } from '@/providers/ProviderManager';
import { useGenerationStore } from '@/store/generationStore';

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
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<Record<string, ModelEntry>>({});
  const [showModels, setShowModels] = useState(false);

  const refresh = useCallback(async () => {
    const list = providerManager.listProviders();
    setProviders(list);

    // Electron 模式：从 config 判断 Provider 是否配置了 API Key
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

    // Web 模式：HTTP 探活
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
        }
      }
    } catch {
      // 静默失败
    }
  }, []);

  useEffect(() => {
    refresh();
    loadModels();
  }, [refresh, loadModels]);

  const activeProvider = providers.find((p) => p.id === activeProviderId);
  const isAvailable = activeProviderId ? availability[activeProviderId] ?? false : false;
  const hasModels = activeProviderId === 'aliyun' && Object.keys(models).length > 0;
  const modelLabel = activeModelId ?? '选择模型';

  return (
    <div className="relative flex items-center gap-2">
      {/* Provider 选择 */}
      <div className="relative">
        <button
          onClick={() => { setOpen(!open); refresh(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-200 hover:border-gray-600 transition-colors"
        >
          <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{activeProvider?.name ?? '选择 Provider'}</span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute top-full mt-1 w-64 rounded-lg border border-gray-700 bg-gray-800 shadow-xl z-20">
            {providers.map((p) => {
              const avail = availability[p.id] ?? false;
              return (
                <button
                  key={p.id}
                  onClick={() => { setActiveProvider(p.id); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    p.id === activeProviderId ? 'bg-gray-700/50' : ''
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${avail ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="flex-1 text-gray-200">{p.name}</span>
                  <span className="text-xs text-gray-500">P{p.priority}</span>
                </button>
              );
            })}
            {providers.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500">无可用 Provider</div>
            )}
          </div>
        )}

        {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
      </div>

      {/* 模型选择（仅 DashScope） */}
      {hasModels && (
        <div className="relative">
          <button
            onClick={() => { setShowModels(!showModels); loadModels(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-200 hover:border-gray-600 transition-colors"
          >
            <span className="text-gray-400">{modelLabel}</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showModels ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showModels && (
            <div className="absolute top-full mt-1 w-72 rounded-lg border border-gray-700 bg-gray-800 shadow-xl z-20 max-h-80 overflow-y-auto">
              {Object.entries(models).map(([mid, info]) => (
                <button
                  key={mid}
                  onClick={() => { setActiveModel(mid); setShowModels(false); }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    mid === activeModelId ? 'bg-gray-700/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-200">{mid}</span>
                    <span className={`text-xs font-mono ${info.remaining === 0 ? 'text-red-400' : info.remaining < 10 ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {info.remaining}/{info.total}
                    </span>
                  </div>
                  {info.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{info.description}</p>
                  )}
                </button>
              ))}
            </div>
          )}

          {showModels && <div className="fixed inset-0 z-10" onClick={() => setShowModels(false)} />}
        </div>
      )}
    </div>
  );
}

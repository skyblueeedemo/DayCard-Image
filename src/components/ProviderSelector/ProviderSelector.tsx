import { useState, useEffect, useCallback } from 'react';
import type { IImageProvider } from '@/providers/IImageProvider';
import { providerManager } from '@/providers/ProviderManager';
import { useGenerationStore } from '@/store/generationStore';

export default function ProviderSelector() {
  const activeProviderId = useGenerationStore((s) => s.activeProviderId);
  const setActiveProvider = useGenerationStore((s) => s.setActiveProvider);

  const [providers, setProviders] = useState<IImageProvider[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => {
    const list = providerManager.listProviders();
    setProviders(list);

    list.forEach(async (p) => {
      try {
        const ok = await p.isAvailable();
        setAvailability((prev) => ({ ...prev, [p.id]: ok }));
      } catch {
        setAvailability((prev) => ({ ...prev, [p.id]: false }));
      }
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeProvider = providers.find((p) => p.id === activeProviderId);
  const isAvailable = activeProviderId ? availability[activeProviderId] ?? false : false;

  return (
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
        <div className="absolute top-full mt-1 w-64 rounded-lg border border-gray-700 bg-gray-800 shadow-xl z-10">
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

      {/* 点击外部关闭 */}
      {open && <div className="fixed inset-0 z-0" onClick={() => setOpen(false)} />}
    </div>
  );
}

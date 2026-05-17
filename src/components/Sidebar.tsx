import { Camera, Circle } from 'lucide-react';
import { ROUTES, type RouteId } from '@/router/routes';
import { useGenerationStore } from '@/store/generationStore';
import { getProviderMeta } from '@/providers/registry';

interface SidebarProps {
  activePage: RouteId;
  onNavigate: (page: RouteId) => void;
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const activeProviderId = useGenerationStore((s) => s.activeProviderId);
  const providerMeta = activeProviderId ? getProviderMeta(activeProviderId) : null;

  return (
    <aside className="w-56 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col select-none">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 dark:border-gray-800">
        <Camera size={20} className="text-fg-primary" strokeWidth={1.75} />
        <span className="text-lg font-bold text-gray-900 dark:text-white tracking-wide">拾光匣</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {ROUTES.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-surface-2 text-fg-primary'
                  : 'text-fg-secondary hover:text-fg-primary hover:bg-surface-2/60'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-brand" aria-hidden />
              )}
              <Icon size={16} strokeWidth={1.75} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-1.5">
        {providerMeta && (
          <div className="flex items-center gap-2 text-xs text-fg-secondary">
            <Circle size={8} className="fill-green-500 text-green-500" />
            <span className="truncate">{providerMeta.label}</span>
          </div>
        )}
        <span className="text-xs text-fg-muted">拾光匣 v1.4.0</span>
      </div>
    </aside>
  );
}

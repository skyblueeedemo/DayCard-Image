import { ROUTES, type RouteId } from '@/router/routes';

interface SidebarProps {
  activePage: RouteId;
  onNavigate: (page: RouteId) => void;
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-56 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col select-none">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 dark:border-gray-800">
        <span className="text-xl">📷</span>
        <span className="text-lg font-bold text-gray-900 dark:text-white tracking-wide">拾光匣</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {ROUTES.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
              activePage === item.id
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white border-r-2 border-brand'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
        拾光匣 dev1.3.1
      </div>
    </aside>
  );
}

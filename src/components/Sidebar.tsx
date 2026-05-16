interface SidebarProps {
  activePage: string;
  onNavigate: (page: 'daily' | 'history' | 'providers' | 'api-config' | 'settings') => void;
}

const navItems: { id: 'daily' | 'history' | 'providers' | 'api-config' | 'settings'; label: string; icon: string }[] = [
  { id: 'daily', label: '今日抽卡', icon: '🎴' },
  { id: 'history', label: '历史记录', icon: '📁' },
  { id: 'providers', label: 'Provider 管理', icon: '⚙' },
  { id: 'api-config', label: 'API 配置', icon: '🔑' },
  { id: 'settings', label: '设置', icon: '🔧' },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col select-none">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-800">
        <span className="text-xl">📷</span>
        <span className="text-lg font-bold text-white tracking-wide">拾光匣</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
              activePage === item.id
                ? 'bg-gray-800 text-white border-r-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-500">
        拾光匣 v1.2.0
      </div>
    </aside>
  );
}

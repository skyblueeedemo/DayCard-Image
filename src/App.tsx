import { useState } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import Sidebar from '@/components/Sidebar';
import ImageGrid from '@/components/ImageGrid/ImageGrid';
import PromptInput from '@/components/DailyCard/PromptInput';
import ProviderSelector from '@/components/ProviderSelector/ProviderSelector';
import QuotaBar from '@/components/QuotaBar/QuotaBar';
import ProviderList from '@/components/ProviderManager/ProviderList';
import HistoryPage from '@/components/History/HistoryPage';
import DailyTheme from '@/components/DailyCard/DailyTheme';

export default function App() {
  useKeyboardShortcuts();

  const [activePage, setActivePage] = useState<
    'daily' | 'history' | 'providers' | 'settings'
  >('daily');

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <main className="flex-1 overflow-y-auto p-6">
        {activePage === 'daily' && (
          <div className="flex flex-col items-center gap-6 py-8">
            <QuotaBar />
            <ProviderSelector />
            <DailyTheme />
            <PromptInput />
            <ImageGrid />
          </div>
        )}

        {activePage === 'history' && <HistoryPage />}

        {activePage === 'providers' && (
          <div className="flex flex-col items-center py-8">
            <ProviderList />
          </div>
        )}

        {activePage === 'settings' && (
          <div className="flex flex-col items-center py-8">
            <div className="w-full max-w-2xl">
              <h2 className="text-lg font-bold text-white mb-4">设置</h2>

              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 mb-4">
                <h3 className="text-sm font-medium text-gray-200 mb-3">API Key 配置</h3>
                <p className="text-sm text-gray-400">
                  API Key 通过 <code className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">config/local.json</code> 管理。
                  复制 <code className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">config/local.example.json</code> 并填入你的 Key。
                </p>
                <div className="mt-3 p-3 rounded bg-gray-900 text-xs text-gray-400 font-mono">
                  {`{
  "providers": {
    "openai": { "apiKey": "sk-..." },
    "stability": { "apiKey": "sk-..." },
    "zhipu": { "apiKey": "..." },
    "aliyun": { "apiKey": "..." }
  }
}`}
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
                <h3 className="text-sm font-medium text-gray-200 mb-3">关于</h3>
                <div className="text-sm text-gray-400 flex flex-col gap-1">
                  <p>拾光匣 DayCard-Image v0.2.0</p>
                  <p>跨平台 AI 图像生成桌面应用</p>
                  <p className="text-xs text-gray-600 mt-2">
                    Electron + React + TypeScript + TailwindCSS
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

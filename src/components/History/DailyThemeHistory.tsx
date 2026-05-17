import { useState } from 'react';
import { getThemeHistory, type DailyThemesEntry } from '@/utils/dailyTheme';
import { useGenerationStore } from '@/store/generationStore';

export default function DailyThemeHistory() {
  const [history] = useState<DailyThemesEntry[]>(() => getThemeHistory());
  const setPrompt = useGenerationStore((s) => s.setPrompt);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <span className="text-5xl mb-4">📅</span>
        <p className="text-sm">暂无主题历史</p>
        <p className="text-xs mt-1 text-gray-400 dark:text-gray-600">每日主题将自动保存在这里</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">主题回顾</h2>

        <div className="flex flex-col gap-6">
          {history.map((entry) => (
            <div key={entry.date} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">{entry.date}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {entry.themes.map((theme, i) => (
                  <div
                    key={i}
                    onClick={() => setPrompt(theme.prompt)}
                    className="rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{theme.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{theme.description}</p>
                    <span className="text-xs text-brand mt-2 inline-block">点击复用</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

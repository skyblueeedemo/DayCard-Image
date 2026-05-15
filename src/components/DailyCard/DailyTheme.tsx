import { useMemo } from 'react';
import { getTodayTheme } from '@/utils/dailyTheme';
import { useGenerationStore } from '@/store/generationStore';

export default function DailyTheme() {
  const theme = useMemo(() => getTodayTheme(), []);
  const setPrompt = useGenerationStore((s) => s.setPrompt);
  const prompt = useGenerationStore((s) => s.prompt);

  const handleUseTheme = () => {
    setPrompt(theme.prompt);
  };

  const isActive = prompt === theme.prompt;

  return (
    <div
      onClick={handleUseTheme}
      className={`w-full max-w-2xl rounded-lg border p-4 cursor-pointer transition-colors ${
        isActive
          ? 'border-blue-600 bg-blue-900/20'
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-200">
            今日主题：{theme.name}
          </h3>
          <p className="text-xs text-gray-400 mt-1">{theme.description}</p>
        </div>
        {!isActive && (
          <span className="text-xs text-blue-400 ml-3 flex-shrink-0">点击使用</span>
        )}
        {isActive && (
          <span className="text-xs text-blue-300 ml-3 flex-shrink-0">已选中</span>
        )}
      </div>
    </div>
  );
}

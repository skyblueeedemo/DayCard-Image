import { useState } from 'react';
import { getTodayThemes, type Theme } from '@/utils/dailyTheme';
import { useGenerationStore } from '@/store/generationStore';

const STARTED_KEY = 'daycard-theme-started';

function hasStarted(): boolean {
  try { return localStorage.getItem(STARTED_KEY) === '1'; } catch { return true; }
}

function markStarted(): void {
  try { localStorage.setItem(STARTED_KEY, '1'); } catch { /* ignore */ }
}

const sampleTheme: Theme = {
  name: '赛博都市 × 摩天大楼',
  description: '霓虹灯下的未来城市，每一次生成都是独一无二的光影',
  prompt: 'a futuristic cyberpunk city at night, neon lights reflecting on wet streets, towering skyscrapers, flying vehicles, ultra detailed, cinematic lighting, 8k',
  styleId: '',
  sceneId: '',
  compositionId: '',
};

export default function DailyTheme() {
  const [started, setStarted] = useState<boolean>(hasStarted);
  const [themes, setThemes] = useState<Theme[]>(() => started ? getTodayThemes() : []);
  const setPrompt = useGenerationStore((s) => s.setPrompt);
  const prompt = useGenerationStore((s) => s.prompt);

  const handleStart = () => {
    markStarted();
    const real = getTodayThemes();
    setThemes(real);
    setStarted(true);
    // 自动选中第一个主题
    if (real[0]) setPrompt(real[0].prompt);
  };

  const handleUseTheme = (theme: Theme) => {
    setPrompt(theme.prompt);
  };

  // 首次使用：样例主题 + 开始按钮
  if (!started) {
    return (
      <div className="w-full max-w-2xl">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">今日主题</h3>
        <div className="rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 p-5 text-center">
          <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 p-4 mb-4 text-left">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {sampleTheme.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {sampleTheme.description}
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            每天三组 AI 灵感主题，一键生成专属壁纸，换种心情
          </p>
          <button
            onClick={handleStart}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/25"
          >
            开始今天的抽卡吧！
          </button>
        </div>
      </div>
    );
  }

  // 正常模式：三组随机主题
  return (
    <div className="w-full max-w-2xl">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">今日主题</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {themes.map((theme, index) => {
          const isActive = prompt === theme.prompt;
          return (
            <div
              key={index}
              onClick={() => handleUseTheme(theme)}
              className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                isActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{theme.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{theme.description}</p>
              <div className="mt-2">
                {isActive ? (
                  <span className="text-xs text-blue-600 dark:text-blue-300">已选中</span>
                ) : (
                  <span className="text-xs text-blue-500 dark:text-blue-400">点击使用</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

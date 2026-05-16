import { useSettingsStore } from '../../store/settingsStore';
import { useToastStore } from '../../store/toastStore';

function ToggleSwitch({
  enabled,
  onChange,
  disabled,
  label,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors overflow-hidden ${
          enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        } disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const {
    autoLaunch,
    schedulerEnabled,
    schedulerTime,
    appearance,
    isUpdating,
    updateSetting,
  } = useSettingsStore();
  const addToast = useToastStore((s) => s.addToast);

  const handleAppearance = async (v: 'dark' | 'light') => {
    // 立即同步 DOM（不等待 IPC）
    const root = document.documentElement;
    if (v === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // localStorage 兜底（Web 模式无 Electron IPC）
    try { localStorage.setItem('daycard-appearance', v); } catch { /* ignore */ }
    // 同步 Electron 持久化
    const ok = await updateSetting('appearance', v);
    if (!ok) {
      // Web 模式：直接更新 Zustand store
      useSettingsStore.setState({ appearance: v });
    }
  };

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">设置</h2>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">外观主题</h3>

          <div className="flex gap-2">
            <button
              onClick={() => handleAppearance('dark')}
              className={`flex-1 text-sm py-2 rounded border transition-colors ${
                appearance === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              🌙 暗夜模式
            </button>
            <button
              onClick={() => handleAppearance('light')}
              className={`flex-1 text-sm py-2 rounded border transition-colors ${
                appearance === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              ☀ 亮白模式
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">系统偏好</h3>

          <ToggleSwitch
            label="开机自启动"
            enabled={autoLaunch}
            disabled={isUpdating}
            onChange={async (v) => {
              const ok = await updateSetting('autoLaunch', v);
              if (!ok) addToast('设置失败，请重试', 'error');
            }}
          />

          <ToggleSwitch
            label="每日自动生图"
            enabled={schedulerEnabled}
            disabled={isUpdating}
            onChange={async (v) => {
              const ok = await updateSetting('schedulerEnabled', v);
              if (!ok) addToast('设置失败，请重试', 'error');
            }}
          />

          {schedulerEnabled && (
            <div className="flex items-center justify-between py-2 mt-1 border-t border-gray-200 dark:border-gray-700/50">
              <span className="text-sm text-gray-600 dark:text-gray-300">触发时间</span>
              <select
                value={schedulerTime}
                onChange={(e) => updateSetting('schedulerTime', e.target.value)}
                className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-200"
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const h = String(i).padStart(2, '0');
                  return (
                    <option key={h} value={`${h}:00`}>
                      {h}:00
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">API Key 配置</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            请在「API 配置」页面管理你的 API Key，支持添加、测试连接和模型管理。
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            API Key 仅存储在本地，不会上传到任何服务器。
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">关于</h3>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col gap-2">
            <p>拾光匣 DayCard-Image dev1.3.0</p>
            <p>日更壁纸 · 拾光成匣</p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Electron + React + TypeScript + TailwindCSS</p>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
              <button
                onClick={() => addToast('暂不支持在线升级，请关注 GitHub Releases 获取最新版本', 'info')}
                className="text-xs px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                检查更新
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

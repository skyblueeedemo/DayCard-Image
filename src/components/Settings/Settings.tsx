import { useSettingsStore } from '../../store/settingsStore';

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
      <span className="text-sm text-gray-300">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        disabled={disabled}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-600'
        } disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
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
    updateSetting,
  } = useSettingsStore();

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-bold text-white mb-4">设置</h2>

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 mb-4">
          <h3 className="text-sm font-medium text-gray-200 mb-3">系统偏好</h3>

          <ToggleSwitch
            label="开机自启动"
            enabled={autoLaunch}
            onChange={(v) => updateSetting('autoLaunch', v)}
          />

          <ToggleSwitch
            label="每日自动生图"
            enabled={schedulerEnabled}
            onChange={(v) => updateSetting('schedulerEnabled', v)}
          />

          {schedulerEnabled && (
            <div className="flex items-center justify-between py-2 mt-1 border-t border-gray-700/50">
              <span className="text-sm text-gray-300">触发时间</span>
              <select
                value={schedulerTime}
                onChange={(e) => updateSetting('schedulerTime', e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
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

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 mb-4">
          <h3 className="text-sm font-medium text-gray-200 mb-3">API Key 配置</h3>
          <p className="text-sm text-gray-400">
            API Key 通过{' '}
            <code className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">config/local.json</code>{' '}
            管理。复制{' '}
            <code className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">config/local.example.json</code>{' '}
            并填入你的 Key。
          </p>
          <div className="mt-3 p-3 rounded bg-gray-900 text-xs text-gray-400 font-mono whitespace-pre-wrap">
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
            <p>拾光匣 DayCard-Image v1.1.0</p>
            <p>跨平台 AI 图像生成桌面应用</p>
            <p className="text-xs text-gray-600 mt-2">Electron + React + TypeScript + TailwindCSS</p>
          </div>
        </div>
      </div>
    </div>
  );
}

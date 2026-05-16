interface Step3PrefsData {
  autoLaunch: boolean;
  schedulerEnabled: boolean;
  schedulerTime: string;
}

interface Step3PrefsProps {
  data: Step3PrefsData;
  onChange: (data: Step3PrefsData) => void;
}

function ToggleSwitch({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
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

export type { Step3PrefsData };

export default function Step3Prefs({ data, onChange }: Step3PrefsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">最后一步：偏好设置</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">可随时在设置页面更改这些选项</p>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <ToggleSwitch
          label="开机自动启动拾光匣"
          enabled={data.autoLaunch}
          onChange={(v) => onChange({ ...data, autoLaunch: v })}
        />
        <ToggleSwitch
          label="每日自动生成图像"
          enabled={data.schedulerEnabled}
          onChange={(v) => onChange({ ...data, schedulerEnabled: v })}
        />
        {data.schedulerEnabled && (
          <div className="flex items-center justify-between py-2 mt-1 border-t border-gray-200 dark:border-gray-700/50">
            <span className="text-sm text-gray-600 dark:text-gray-300">触发时间</span>
            <select
              value={data.schedulerTime}
              onChange={(e) => onChange({ ...data, schedulerTime: e.target.value })}
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

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
        点击「完成」即可进入拾光匣，开始每日抽卡
      </p>
    </div>
  );
}

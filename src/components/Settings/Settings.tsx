import { useState, useEffect } from 'react';
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
      <span className="text-sm text-gray-300">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors overflow-hidden ${
          enabled ? 'bg-blue-600' : 'bg-gray-600'
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
    isUpdating,
    updateSetting,
  } = useSettingsStore();
  const addToast = useToastStore((s) => s.addToast);

  const [updateStatus, setUpdateStatus] = useState<
    'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'
  >('idle');
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    const unsubAvailable = window.electronAPI?.onEvent('update:available', (data) => {
      if (typeof data === 'object' && data && 'version' in data) {
        setUpdateVersion((data as { version: string }).version);
        setUpdateStatus('available');
      }
    });
    const unsubNotAvailable = window.electronAPI?.onEvent('update:not-available', () => {
      if (updateStatus === 'checking') setUpdateStatus('idle');
    });
    const unsubDownloaded = window.electronAPI?.onEvent('update:downloaded', () => {
      setUpdateStatus('downloaded');
    });
    const unsubError = window.electronAPI?.onEvent('update:error', (data) => {
      const msg = typeof data === 'object' && data && 'message' in data
        ? (data as { message: string }).message
        : '更新错误';
      setUpdateError(msg);
      setUpdateStatus('error');
    });

    return () => {
      unsubAvailable?.();
      unsubNotAvailable?.();
      unsubDownloaded?.();
      unsubError?.();
    };
  }, [updateStatus]);

  const handleCheckUpdate = async () => {
    setUpdateStatus('checking');
    setUpdateError(null);
    try {
      await window.electronAPI?.checkForUpdate?.();
    } catch {
      setUpdateError('检查更新失败');
      setUpdateStatus('error');
    }
  };

  const handleDownloadUpdate = async () => {
    setUpdateStatus('downloading');
    try {
      await window.electronAPI?.downloadUpdate?.();
    } catch {
      setUpdateError('下载失败');
      setUpdateStatus('error');
    }
  };

  const handleInstallUpdate = () => {
    window.electronAPI?.installUpdate?.();
  };

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-bold text-white mb-4">设置</h2>

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 mb-4">
          <h3 className="text-sm font-medium text-gray-200 mb-3">系统偏好</h3>

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
          <div className="text-sm text-gray-400 flex flex-col gap-2">
            <p>拾光匣 DayCard-Image v1.2.0</p>
            <p>跨平台 AI 图像生成桌面应用</p>
            <p className="text-xs text-gray-600 mt-1">Electron + React + TypeScript + TailwindCSS</p>

            <div className="mt-3 pt-3 border-t border-gray-700/50">
              {updateStatus === 'idle' && (
                <button
                  onClick={handleCheckUpdate}
                  className="text-xs px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                >
                  检查更新
                </button>
              )}
              {updateStatus === 'checking' && (
                <span className="text-xs text-gray-400 flex items-center gap-2">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  正在检查更新...
                </span>
              )}
              {updateStatus === 'available' && updateVersion && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-green-400">新版本 v{updateVersion} 可用</span>
                  <button
                    onClick={handleDownloadUpdate}
                    className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-500 transition-colors"
                  >
                    立即更新
                  </button>
                </div>
              )}
              {updateStatus === 'downloading' && (
                <span className="text-xs text-blue-400">正在下载更新...</span>
              )}
              {updateStatus === 'downloaded' && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-green-400">更新已下载，重启生效</span>
                  <button
                    onClick={handleInstallUpdate}
                    className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-500 transition-colors"
                  >
                    立即重启
                  </button>
                </div>
              )}
              {updateStatus === 'error' && (
                <span className="text-xs text-red-400">{updateError ?? '检查更新失败'}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Moon, Sun, RefreshCw, Download, RotateCw, Check, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useToastStore } from '../../store/toastStore';
import { storageAdapter } from '../../store/storageAdapter';

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
          enabled ? 'bg-neutral-500' : 'bg-gray-300 dark:bg-gray-600'
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

  // ─── 自动更新状态机 ───────────────────────────────
  type UpdateStatus = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<{ version?: string; releaseDate?: string } | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.electronAPI?.onEvent) return;

    const unsubAvailable = window.electronAPI.onEvent('update:available', (data) => {
      const info = data as { version?: string; releaseDate?: string };
      setUpdateInfo(info ?? null);
      setUpdateStatus('available');
    });
    const unsubNotAvailable = window.electronAPI.onEvent('update:not-available', () => {
      setUpdateStatus('not-available');
      addToast('当前已是最新版本', 'success');
    });
    const unsubDownloaded = window.electronAPI.onEvent('update:downloaded', () => {
      setUpdateStatus('downloaded');
    });
    const unsubError = window.electronAPI.onEvent('update:error', (data) => {
      const info = data as { message?: string };
      setUpdateError(info?.message ?? '检查更新失败');
      setUpdateStatus('error');
    });

    return () => {
      unsubAvailable?.();
      unsubNotAvailable?.();
      unsubDownloaded?.();
      unsubError?.();
    };
  }, [addToast]);

  const handleCheckUpdate = async () => {
    if (!window.electronAPI?.checkForUpdate) {
      addToast('当前环境不支持自动更新，请关注 GitHub Releases', 'info');
      return;
    }
    setUpdateStatus('checking');
    setUpdateError(null);
    try {
      await window.electronAPI.checkForUpdate();
    } catch {
      setUpdateError('检查更新失败');
      setUpdateStatus('error');
    }
  };

  const handleDownloadUpdate = async () => {
    if (!window.electronAPI?.downloadUpdate) return;
    setUpdateStatus('downloading');
    try {
      await window.electronAPI.downloadUpdate();
      // download 完成由 'update:downloaded' 事件转 status='downloaded'
    } catch {
      setUpdateError('下载更新失败');
      setUpdateStatus('error');
    }
  };

  const handleInstallUpdate = async () => {
    if (!window.electronAPI?.installUpdate) return;
    const confirmed = window.confirm(
      '应用即将关闭并安装更新，未保存的工作可能会丢失。\n\n确认现在重启更新吗？',
    );
    if (!confirmed) return;
    try {
      await window.electronAPI.installUpdate();
    } catch {
      addToast('启动安装失败', 'error');
    }
  };

  const handleAppearance = async (v: 'dark' | 'light') => {
    // 立即同步 DOM（不等待 IPC）
    const root = document.documentElement;
    if (v === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // localStorage 兜底（Web 模式无 Electron IPC）
    storageAdapter.setString('daycard-appearance', v);
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
              className={`flex-1 text-sm py-2 rounded border transition-colors flex items-center justify-center gap-2 ${
                appearance === 'dark'
                  ? 'border-brand bg-brand/5 dark:bg-brand/10 text-brand'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Moon size={16} strokeWidth={1.75} />
              暗夜模式
            </button>
            <button
              onClick={() => handleAppearance('light')}
              className={`flex-1 text-sm py-2 rounded border transition-colors flex items-center justify-center gap-2 ${
                appearance === 'light'
                  ? 'border-brand bg-brand/5 dark:bg-brand/10 text-brand'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Sun size={16} strokeWidth={1.75} />
              亮白模式
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
            <p>拾光匣 DayCard-Image v1.4.0</p>
            <p>日更壁纸 · 拾光成匣</p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Electron + React + TypeScript + TailwindCSS</p>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
              {/* 状态：idle / not-available / error → 显示「检查更新」按钮 */}
              {(updateStatus === 'idle' || updateStatus === 'not-available' || updateStatus === 'error') && (
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleCheckUpdate}
                    className="text-xs px-4 py-2 rounded bg-brand text-brand-fg hover:bg-brand-hover transition-colors flex items-center gap-2"
                  >
                    <RefreshCw size={14} strokeWidth={1.75} />
                    检查更新
                  </button>
                  {updateStatus === 'error' && updateError && (
                    <span className="text-xs text-status-danger flex items-center gap-1">
                      <AlertCircle size={14} strokeWidth={1.75} />
                      {updateError}
                    </span>
                  )}
                </div>
              )}

              {/* 状态：checking */}
              {updateStatus === 'checking' && (
                <div className="flex items-center gap-2 text-xs text-fg-secondary">
                  <RefreshCw size={14} strokeWidth={1.75} className="animate-spin" />
                  正在检查更新...
                </div>
              )}

              {/* 状态：available — 询问是否下载 */}
              {updateStatus === 'available' && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-fg-primary">
                    发现新版本 <span className="font-mono font-medium">v{updateInfo?.version}</span>
                    {updateInfo?.releaseDate && (
                      <span className="text-fg-muted ml-2">
                        发布于 {new Date(updateInfo.releaseDate).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadUpdate}
                      className="text-xs px-4 py-2 rounded bg-brand text-brand-fg hover:bg-brand-hover transition-colors flex items-center gap-2"
                    >
                      <Download size={14} strokeWidth={1.75} />
                      立即下载
                    </button>
                    <button
                      onClick={() => setUpdateStatus('idle')}
                      className="text-xs px-4 py-2 rounded border border-border-default text-fg-secondary hover:bg-surface-2 transition-colors"
                    >
                      稍后再说
                    </button>
                  </div>
                </div>
              )}

              {/* 状态：downloading */}
              {updateStatus === 'downloading' && (
                <div className="flex items-center gap-2 text-xs text-fg-secondary">
                  <Download size={14} strokeWidth={1.75} className="animate-pulse" />
                  下载中，请稍候...
                </div>
              )}

              {/* 状态：downloaded — 询问是否安装 */}
              {updateStatus === 'downloaded' && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-fg-primary flex items-center gap-1">
                    <Check size={14} strokeWidth={1.75} className="text-status-success" />
                    新版本下载完成
                  </p>
                  <button
                    onClick={handleInstallUpdate}
                    className="self-start text-xs px-4 py-2 rounded bg-brand text-brand-fg hover:bg-brand-hover transition-colors flex items-center gap-2"
                  >
                    <RotateCw size={14} strokeWidth={1.75} />
                    立即重启更新
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

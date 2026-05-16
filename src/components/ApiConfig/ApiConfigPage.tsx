import { useState, useEffect, useCallback } from 'react';
import { useToastStore } from '../../store/toastStore';

interface ModelInfo {
  description?: string;
  remaining: number;
  total: number;
}

interface ProviderEntry {
  hasKey: boolean;
  maskedKey: string | null;
  models: Record<string, ModelInfo>;
}

interface ConfigData {
  providers: Record<string, ProviderEntry>;
}

const PROVIDER_LABELS: Record<string, string> = {
  aliyun: 'DashScope (阿里云)',
  openai: 'OpenAI',
  stability: 'Stability AI',
  zhipu: '智谱 CogView',
};

const DEFAULT_MODELS: Record<string, Record<string, ModelInfo>> = {
  aliyun: {
    'wan2.7-image-pro': { description: '文字渲染、品牌色、角色一致性多图生成、多图编辑', remaining: 50, total: 50 },
    'wan2.7-image': { description: '生成速度更快，最高2K', remaining: 50, total: 50 },
    'z-image-turbo': { description: '快速生成、低成本、写实人像', remaining: 100, total: 100 },
    'qwen-image-2.0': { description: '', remaining: 100, total: 100 },
    'qwen-image-2.0-2026-03-03': { description: '', remaining: 100, total: 100 },
    'qwen-image-2.0-pro-2026-03-03': { description: '负向提示词、最多6张图片变体', remaining: 100, total: 100 },
    'qwen-image-2.0-pro': { description: '负向提示词、最多6张图片变体', remaining: 97, total: 100 },
    'qwen-image-2.0-pro-2026-04-22': { description: '负向提示词、最多6张图片变体', remaining: 100, total: 100 },
  },
};

export default function ApiConfigPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const addToast = useToastStore((s) => s.addToast);

  const loadConfig = useCallback(async () => {
    if (!window.electronAPI?.getConfig) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await window.electronAPI.getConfig();
      if (res.status === 'ok' && res.data) {
        setConfig(res.data as unknown as ConfigData);
      }
    } catch {
      addToast('加载配置失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSaveKey = async () => {
    if (!editingProvider || !window.electronAPI?.updateConfig) return;
    setSaving(true);
    try {
      const res = await window.electronAPI.updateConfig({
        providerId: editingProvider,
        apiKey: keyInput,
      });
      if (res.status === 'ok') {
        addToast('API Key 已保存', 'success');
        setEditingProvider(null);
        setKeyInput('');
        loadConfig();
      } else {
        addToast(res.message ?? '保存失败', 'error');
      }
    } catch {
      addToast('保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (providerId: string) => {
    if (!window.electronAPI?.testConnection) return;
    const key = keyInput;
    if (!key) {
      setTestResult({ ok: false, msg: '请先输入 API Key' });
      return;
    }
    setTesting(providerId);
    setTestResult(null);
    try {
      const res = await window.electronAPI.testConnection({ providerId, apiKey: key });
      setTestResult({
        ok: res.status === 'ok',
        msg: res.message ?? (res.status === 'ok' ? '成功' : '失败'),
      });
    } catch {
      setTestResult({ ok: false, msg: '测试请求失败' });
    } finally {
      setTesting(null);
    }
  };

  const handleInitModels = async (providerId: string) => {
    if (!window.electronAPI?.updateConfig) return;
    const models = DEFAULT_MODELS[providerId];
    if (!models) return;
    setSaving(true);
    try {
      await window.electronAPI.updateConfig({ providerId, models });
      addToast('模型已初始化', 'success');
      loadConfig();
    } catch {
      addToast('初始化失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const providers = config?.providers ?? {};

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-bold text-white mb-4">API 配置</h2>

        {Object.entries(PROVIDER_LABELS).map(([pid, label]) => {
          const entry = providers[pid];
          const hasKey = entry?.hasKey ?? false;
          const models = entry?.models ?? {};
          const modelCount = Object.keys(models).length;
          const isExpanded = expandedProvider === pid;
          const isEditing = editingProvider === pid;

          return (
            <div key={pid} className="rounded-lg border border-gray-700 bg-gray-800 mb-3 overflow-hidden">
              {/* Provider 头部 */}
              <button
                onClick={() => setExpandedProvider(isExpanded ? null : pid)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-750 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <span className="text-sm font-medium text-gray-200">{label}</span>
                  {hasKey && <span className="text-xs text-gray-500">{entry?.maskedKey}</span>}
                </div>
                <div className="flex items-center gap-3">
                  {modelCount > 0 && (
                    <span className="text-xs text-gray-500">{modelCount} 个模型</span>
                  )}
                  <span className="text-xs text-gray-600">{isExpanded ? '收起' : '展开'}</span>
                </div>
              </button>

              {/* 展开区域 */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-700/50">
                  {/* API Key 编辑 */}
                  <div className="mt-3">
                    <label className="text-xs text-gray-400">API Key</label>
                    {isEditing ? (
                      <div className="mt-1 flex gap-2">
                        <input
                          type="password"
                          value={keyInput}
                          onChange={(e) => setKeyInput(e.target.value)}
                          placeholder="输入 API Key..."
                          className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          onClick={handleSaveKey}
                          disabled={saving || !keyInput.trim()}
                          className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                        >
                          {saving ? '...' : '保存'}
                        </button>
                        <button
                          onClick={() => { setEditingProvider(null); setKeyInput(''); setTestResult(null); }}
                          className="px-3 py-1.5 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex gap-2">
                        <input
                          type="text"
                          value={entry?.maskedKey ?? '未配置'}
                          disabled
                          className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-500 cursor-not-allowed"
                        />
                        <button
                          onClick={() => { setEditingProvider(pid); setKeyInput(''); setTestResult(null); }}
                          className="px-3 py-1.5 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                        >
                          {hasKey ? '修改' : '添加'}
                        </button>
                      </div>
                    )}

                    {isEditing && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => handleTestConnection(pid)}
                          disabled={testing === pid || !keyInput.trim()}
                          className="text-xs px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
                        >
                          {testing === pid ? '测试中...' : '测试连接'}
                        </button>
                        {testResult && (
                          <span className={`text-xs ${testResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                            {testResult.msg}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 模型列表 */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-400">模型列表</label>
                      {!modelCount && (
                        <button
                          onClick={() => handleInitModels(pid)}
                          disabled={saving}
                          className="text-xs px-2 py-0.5 rounded bg-gray-700 text-blue-400 hover:bg-gray-600 disabled:opacity-50"
                        >
                          导入默认模型
                        </button>
                      )}
                    </div>

                    {modelCount > 0 ? (
                      <div className="mt-2 space-y-1">
                        {Object.entries(models).map(([mid, info]) => (
                          <div key={mid} className="flex items-center justify-between py-1.5 px-2 rounded bg-gray-900/50">
                            <div>
                              <span className="text-sm text-gray-200">{mid}</span>
                              {info.description && (
                                <span className="text-xs text-gray-500 ml-2">{info.description}</span>
                              )}
                            </div>
                            <span className={`text-xs font-mono ${info.remaining === 0 ? 'text-red-400' : info.remaining < 10 ? 'text-yellow-400' : 'text-gray-400'}`}>
                              {info.remaining}/{info.total}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-600">暂无模型配置，点击 &quot;导入默认模型&quot; 初始化</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <p className="text-xs text-gray-600 mt-4 text-center">
          API Key 仅存储在本地 config/local.json 中，不会上传到任何服务器
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToastStore } from '../../store/toastStore';
import { useGenerationStore } from '../../store/generationStore';
import { loadOrder, saveOrder, loadModelOrder, saveModelOrder } from '../../utils/providerOrder';
import { getProviderLabels, getDefaultModels } from '../../providers/registry';
import { storageAdapter } from '../../store/storageAdapter';

interface ModelInfo {
  description?: string;
  remaining: number;
  total: number;
}

interface ProviderEntry {
  hasKey: boolean;
  maskedKey: string | null;
  baseURL?: string;
  models: Record<string, ModelInfo>;
}

interface ConfigData {
  providers: Record<string, ProviderEntry>;
}

interface TestResultDetail {
  ok: boolean;
  msg: string;
  latencyMs?: number;
  errorCode?: string;
}

interface ApiModelMeta {
  id: string;
  name?: string;
  description?: string;
}

interface ListModelsCache {
  fetchedAt: number;
  models: ApiModelMeta[];
}

const LIST_MODELS_CACHE_TTL = 10 * 60 * 1000; // 10 分钟（D-2.1 选项 A）

function listModelsCacheKey(providerId: string): string {
  return `daycard-list-models-${providerId}`;
}

function sortEntries(entries: [string, string][], order: string[]): [string, string][] {
  if (order.length === 0) return entries;
  const indexMap = new Map(order.map((id, i) => [id, i]));
  return [...entries].sort((a, b) => {
    const ai = indexMap.get(a[0]) ?? 999;
    const bi = indexMap.get(b[0]) ?? 999;
    return ai - bi;
  });
}

export default function ApiConfigPage() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [baseURLInput, setBaseURLInput] = useState('');
  const [showBaseURL, setShowBaseURL] = useState<string | null>(null); // 控制 baseURL 输入折叠
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResultDetail | null>(null);
  const [providerOrder, setProviderOrder] = useState<string[]>(() => loadOrder());
  const [modelOrders, setModelOrders] = useState<Record<string, string[]>>({});
  const [fetchingModels, setFetchingModels] = useState<string | null>(null);

  const addToast = useToastStore((s) => s.addToast);
  const activeProviderId = useGenerationStore((s) => s.activeProviderId);
  const activeModelId = useGenerationStore((s) => s.activeModelId);
  const setActiveProvider = useGenerationStore((s) => s.setActiveProvider);

  // 从注册表读取标签与默认模型（按 import.meta.env.DEV 过滤 Mock）
  const providerLabels = useMemo(() => getProviderLabels(import.meta.env.DEV), []);
  const defaultModels = useMemo(() => getDefaultModels(), []);

  const loadConfig = useCallback(async () => {
    if (!window.electronAPI?.getConfig) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await window.electronAPI.getConfig();
      if (res.status === 'ok' && res.data) {
        const data = res.data as unknown as ConfigData;
        setConfig(data);
        setProviderOrder(loadOrder());
        // 加载所有 provider 的模型排序
        const mo: Record<string, string[]> = {};
        for (const pid of Object.keys(providerLabels)) {
          mo[pid] = loadModelOrder(pid);
        }
        setModelOrders(mo);
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
      const params: { providerId: string; apiKey?: string; baseURL?: string } = {
        providerId: editingProvider,
      };
      if (keyInput) params.apiKey = keyInput;
      // 同步保存 baseURL（只有用户展开过 baseURL 编辑面板时才传，避免误删）
      if (showBaseURL === editingProvider) {
        params.baseURL = baseURLInput; // 空字符串会被主进程解释为"删除字段"
      }
      const res = await window.electronAPI.updateConfig(params);
      if (res.status === 'ok') {
        addToast('配置已保存', 'success');
        setEditingProvider(null);
        setKeyInput('');
        setBaseURLInput('');
        setShowBaseURL(null);
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
      const params: { providerId: string; apiKey: string; baseURL?: string } = {
        providerId,
        apiKey: key,
      };
      if (showBaseURL === providerId && baseURLInput) {
        params.baseURL = baseURLInput;
      }
      const res = await window.electronAPI.testConnection(params);
      setTestResult({
        ok: res.status === 'ok',
        msg: res.message ?? (res.status === 'ok' ? '成功' : '失败'),
        latencyMs: res.latencyMs,
        errorCode: res.errorCode,
      });
    } catch {
      setTestResult({ ok: false, msg: '测试请求失败' });
    } finally {
      setTesting(null);
    }
  };

  /**
   * 从 API 拉取模型列表，与现有 config 的 models 做 diff 合并：
   * - 新模型：用注册表默认配额初始化
   * - 已存在模型：保留 remaining（避免覆盖用户用过的配额）— D-2.2 选项 B
   */
  const handleFetchModels = async (providerId: string) => {
    if (!window.electronAPI?.listProviderModels) return;
    setFetchingModels(providerId);
    try {
      // 优先读 storageAdapter 缓存（10 分钟 TTL）— D-2.1 选项 A
      const cached = storageAdapter.getJSON<ListModelsCache | null>(listModelsCacheKey(providerId), null);
      let models: ApiModelMeta[];
      if (cached && Date.now() - cached.fetchedAt < LIST_MODELS_CACHE_TTL) {
        models = cached.models;
      } else {
        const res = await window.electronAPI.listProviderModels(providerId);
        if (res.status !== 'ok' || !res.data) {
          addToast(res.message ?? '获取模型失败', 'error');
          return;
        }
        models = res.data;
        storageAdapter.setJSON(listModelsCacheKey(providerId), {
          fetchedAt: Date.now(),
          models,
        });
      }

      // diff 合并到现有 config
      const existing = config?.providers[providerId]?.models ?? {};
      const defaultsForProvider = defaultModels[providerId] ?? {};
      const merged: Record<string, ModelInfo> = { ...existing };
      for (const m of models) {
        if (merged[m.id]) {
          // 已存在：保留 remaining，但允许更新 description
          if (m.description) merged[m.id] = { ...merged[m.id], description: m.description };
        } else {
          // 新模型：用注册表默认值（若无则按 100 初始化）
          const def = defaultsForProvider[m.id];
          merged[m.id] = {
            description: m.description ?? def?.description,
            remaining: def?.total ?? 100,
            total: def?.total ?? 100,
          };
        }
      }

      const updateRes = await window.electronAPI.updateConfig?.({
        providerId,
        models: merged,
      });
      if (updateRes?.status === 'ok') {
        addToast(`已同步 ${models.length} 个模型`, 'success');
        loadConfig();
      } else {
        addToast('保存模型列表失败', 'error');
      }
    } catch {
      addToast('获取模型失败', 'error');
    } finally {
      setFetchingModels(null);
    }
  };

  const handleInitModels = async (providerId: string) => {
    if (!window.electronAPI?.updateConfig) return;
    const models = defaultModels[providerId];
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

  const moveOrder = (index: number, dir: -1 | 1) => {
    const entries = sortedEntries;
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= entries.length) return;

    const order = entries.map(([id]) => id);
    [order[index], order[newIndex]] = [order[newIndex], order[index]];

    setProviderOrder(order);
    saveOrder(order);
  };

  const moveModelOrder = (providerId: string, index: number, dir: -1 | 1) => {
    const models = config?.providers[providerId]?.models;
    if (!models) return;
    const entries = Object.keys(models);
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= entries.length) return;

    const order = [...entries];
    [order[index], order[newIndex]] = [order[newIndex], order[index]];

    setModelOrders((prev) => ({ ...prev, [providerId]: order }));
    saveModelOrder(providerId, order);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const providers = config?.providers ?? {};
  const entries = Object.entries(providerLabels);
  const sortedEntries = sortEntries(entries, providerOrder);

  const cardClass = "rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mb-3 overflow-hidden";
  const btnSortClass = "text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">API 配置</h2>

        {sortedEntries.map(([pid, label], index) => {
          const entry = providers[pid];
          const isMock = pid === 'mock';
          const hasKey = entry?.hasKey ?? false;
          const models = entry?.models ?? {};
          const modelCount = Object.keys(models).length;
          const isExpanded = expandedProvider === pid;
          const isEditing = editingProvider === pid;
          const isActive = hasKey || isMock;

          return (
            <div key={pid} className={cardClass}>
              {/* 模型服务头部 */}
              <div className="flex items-center">
                <button
                  onClick={() => setExpandedProvider(isExpanded ? null : pid)}
                  className="flex-1 flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-500'}`} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
                    {hasKey && !isMock && <span className="text-xs text-gray-400 dark:text-gray-500">{entry?.maskedKey}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {modelCount > 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{modelCount} 个模型</span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-600">{isExpanded ? '收起' : '展开'}</span>
                  </div>
                </button>
                <div className="flex items-center gap-0.5 pr-2">
                  <button onClick={() => moveOrder(index, -1)} disabled={index === 0} className={btnSortClass} title="上移">↑</button>
                  <button onClick={() => moveOrder(index, 1)} disabled={index === sortedEntries.length - 1} className={btnSortClass} title="下移">↓</button>
                  {pid === activeProviderId ? (
                    <span className="text-xs text-blue-500 dark:text-blue-400 ml-2">当前</span>
                  ) : (
                    <button
                      onClick={() => setActiveProvider(pid)}
                      className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors ml-2"
                    >
                      切换
                    </button>
                  )}
                </div>
              </div>

              {/* 展开区域 */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700/50">
                  {pid === 'mock' ? (
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <p>Mock 模型服务仅用于开发测试，无需配置 API Key。</p>
                      <p className="mt-1">它会返回占位图，不会调用真实 API。</p>
                    </div>
                  ) : (
                    <>
                  <div className="mt-3">
                    <label className="text-xs text-gray-500 dark:text-gray-400">API Key</label>
                    {isEditing ? (
                      <div className="mt-1 flex gap-2">
                        <input
                          type="password"
                          value={keyInput}
                          onChange={(e) => setKeyInput(e.target.value)}
                          placeholder="输入 API Key..."
                          className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none"
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
                          className="px-3 py-1.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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
                          className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        />
                        <button
                          onClick={() => { setEditingProvider(pid); setKeyInput(''); setTestResult(null); }}
                          className="px-3 py-1.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          {hasKey ? '修改' : '添加'}
                        </button>
                      </div>
                    )}

                    {isEditing && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleTestConnection(pid)}
                          disabled={testing === pid || !keyInput.trim()}
                          className="text-xs px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                        >
                          {testing === pid ? '测试中...' : '测试连接'}
                        </button>
                        <button
                          onClick={() => {
                            if (showBaseURL === pid) {
                              setShowBaseURL(null);
                              setBaseURLInput('');
                            } else {
                              setShowBaseURL(pid);
                              setBaseURLInput(entry?.baseURL ?? '');
                            }
                          }}
                          className="text-xs px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          {showBaseURL === pid ? '收起 Base URL' : '自定义 Base URL'}
                        </button>
                        {testResult && (
                          <div className={`text-xs flex items-center gap-2 ${testResult.ok ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                            <span>{testResult.msg}</span>
                            {testResult.latencyMs !== undefined && (
                              <span className="text-gray-400 dark:text-gray-500">· {testResult.latencyMs}ms</span>
                            )}
                            {testResult.errorCode && (
                              <span className="text-gray-400 dark:text-gray-500 font-mono">· {testResult.errorCode}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {isEditing && showBaseURL === pid && (
                      <div className="mt-2">
                        <label className="text-xs text-gray-500 dark:text-gray-400">
                          自定义 Base URL（留空恢复默认）
                        </label>
                        <input
                          type="text"
                          value={baseURLInput}
                          onChange={(e) => setBaseURLInput(e.target.value)}
                          placeholder="例如：https://api.example.com/v1"
                          className="mt-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 focus:border-blue-500 focus:outline-none font-mono"
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          适用于代理、镜像或私有部署。点击保存后生效。
                        </p>
                      </div>
                    )}

                    {!isEditing && entry?.baseURL && (
                      <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 font-mono">
                        Base URL: {entry.baseURL}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="text-xs text-gray-500 dark:text-gray-400">模型列表</label>
                      <div className="flex items-center gap-1">
                        {!modelCount && defaultModels[pid] && (
                          <button
                            onClick={() => handleInitModels(pid)}
                            disabled={saving}
                            className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                          >
                            导入默认模型
                          </button>
                        )}
                        {hasKey && pid !== 'mock' && (
                          <button
                            onClick={() => handleFetchModels(pid)}
                            disabled={fetchingModels === pid || saving}
                            className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                            title="从 API 拉取最新模型列表（10 分钟内有缓存）"
                          >
                            {fetchingModels === pid ? '同步中...' : '从 API 同步'}
                          </button>
                        )}
                      </div>
                    </div>

                    {modelCount > 0 ? (
                      <div className="mt-2 space-y-1">
                        {(() => {
                          const entries = Object.entries(models);
                          const order = modelOrders[pid] ?? [];
                          const sorted = order.length > 0
                            ? [...entries].sort((a, b) => {
                                const ai = order.indexOf(a[0]);
                                const bi = order.indexOf(b[0]);
                                return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
                              })
                            : entries;
                          return sorted.map(([mid, info], index) => {
                            const isCurrentModel =
                              pid === activeProviderId && mid === activeModelId;
                            return (
                              <div
                                key={mid}
                                className={`flex items-center gap-1 py-1.5 px-2 rounded ${
                                  isCurrentModel
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                                    : 'bg-gray-50 dark:bg-gray-900/50'
                                }`}
                              >
                                <button onClick={() => moveModelOrder(pid, index, -1)} disabled={index === 0} className="text-xs px-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20" title="上移">↑</button>
                                <button onClick={() => moveModelOrder(pid, index, 1)} disabled={index === sorted.length - 1} className="text-xs px-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20" title="下移">↓</button>
                                <div className="flex-1 flex items-center justify-between">
                                  <div>
                                    <span className="text-sm text-gray-700 dark:text-gray-200">{mid}</span>
                                    {isCurrentModel && (
                                      <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">· 当前选用</span>
                                    )}
                                    {info.description && (
                                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{info.description}</span>
                                    )}
                                  </div>
                                  <span className={`text-xs font-mono flex-shrink-0 ${info.remaining === 0 ? 'text-red-500' : info.remaining < 10 ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {info.remaining}/{info.total}
                                  </span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">暂无模型配置，点击 &quot;导入默认模型&quot; 初始化</p>
                    )}
                  </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <p className="text-xs text-gray-400 dark:text-gray-600 mt-4 text-center">
          API Key 仅存储在本地，不会上传到任何服务器
        </p>
      </div>
    </div>
  );
}

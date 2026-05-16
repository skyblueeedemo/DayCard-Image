import { contextBridge, ipcRenderer } from 'electron';

/**
 * 向渲染进程暴露安全的 IPC 接口
 * 禁止直接暴露 ipcRenderer.on/send，仅暴露封装好的方法
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // 图像生成
  generateImage: (params: {
    prompt: string;
    providerId?: string;
    options?: Record<string, unknown>;
  }) => ipcRenderer.invoke('image:generate', params),

  // Provider 列表
  getProviders: () => ipcRenderer.invoke('provider:list'),

  // 配额查询
  getQuota: (providerId: string) => ipcRenderer.invoke('quota:get', providerId),
  getQuotaHistory: (providerId: string) => ipcRenderer.invoke('quota:history', providerId),
  getAllQuotas: () => ipcRenderer.invoke('quota:all'),
  getModelQuota: (params: { providerId: string; modelId: string }) =>
    ipcRenderer.invoke('quota:get-model', params),

  // 文件保存
  saveImage: (params: { imageUrl: string; defaultName?: string }) =>
    ipcRenderer.invoke('file:save-image', params),

  // 壁纸设置
  setWallpaper: (params: { imagePath: string }) =>
    ipcRenderer.invoke('wallpaper:set', params),

  // 偏好反馈
  likePrompt: (params: { imageUrl: string; styleId: string; sceneId: string; compositionId: string }) =>
    ipcRenderer.invoke('preference:like', params),
  unlikePrompt: (params: { imageUrl: string; styleId: string; sceneId: string; compositionId: string }) =>
    ipcRenderer.invoke('preference:unlike', params),
  getPreferenceWeights: () => ipcRenderer.invoke('preference:get-weights'),
  getLikedResults: () => ipcRenderer.invoke('preference:get-liked'),

  // 结果持久化
  loadResults: () => ipcRenderer.invoke('results:load'),
  saveResults: (results: unknown[]) => ipcRenderer.invoke('results:save', results),

  // API 配置
  getConfig: () => ipcRenderer.invoke('config:get'),
  updateConfig: (params: { providerId: string; apiKey?: string; models?: Record<string, { description?: string; remaining: number; total: number }> }) =>
    ipcRenderer.invoke('config:set', params),
  testConnection: (params: { providerId: string; apiKey: string }) =>
    ipcRenderer.invoke('config:test', params),

  // 自动更新
  checkForUpdate: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),

  // 系统设置
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSetting: (key: string, value: unknown) =>
    ipcRenderer.invoke('settings:set', { key, value }),

  // 主进程事件订阅（白名单通道）
  onEvent: (channel: string, callback: (data: unknown) => void) => {
    const allowed = ['navigate-to', 'scheduler:completed', 'network:status-changed', 'update:available', 'update:not-available', 'update:downloaded', 'update:error'];
    if (!allowed.includes(channel)) return () => {};
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on(channel, handler);
    return () => { ipcRenderer.removeListener(channel, handler); };
  },
});

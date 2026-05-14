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
});

import { providerManager } from './ProviderManager';
import { MockProvider } from './mock/MockProvider';
import { OpenAIProvider } from './openai/OpenAIProvider';

export function bootstrapProviders(): void {
  // 开发环境：注册 MockProvider 用于零费用开发测试
  if (import.meta.env.DEV) {
    providerManager.register(new MockProvider());
    return;
  }

  // 生产环境：Provider 由 Electron 主进程通过 IPC 注入 API Key 后注册
  // 此处仅做占位，实际注册在 electron/main.ts 的 IPC handler 中完成
}

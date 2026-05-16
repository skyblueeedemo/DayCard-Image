import { providerManager } from './ProviderManager';
import { MockProvider } from './mock/MockProvider';
import { OpenAIProvider } from './openai/OpenAIProvider';
import { StabilityProvider } from './stability/StabilityProvider';
import { ZhipuProvider } from './zhipu/ZhipuProvider';
import { AliyunProvider } from './aliyun/AliyunProvider';

export function bootstrapProviders(): void {
  // 开发环境：注册 MockProvider + 真实 Provider 用于 UI 展示
  if (import.meta.env.DEV) {
    providerManager.register(new MockProvider());
  }

  // 所有环境：注册真实 Provider（Electron 下实际生成走 IPC，此处供 ProviderSelector 展示）
  providerManager.register(new OpenAIProvider({ apiKey: '' }));
  providerManager.register(new StabilityProvider({ apiKey: '' }));
  providerManager.register(new ZhipuProvider({ apiKey: '' }));
  providerManager.register(new AliyunProvider({ apiKey: '' }));
}

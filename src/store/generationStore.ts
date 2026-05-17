import { create } from 'zustand';
import type { ImageResult } from '@/providers/IImageProvider';
import { providerManager } from '@/providers/ProviderManager';
import { persistenceStore } from './persistenceStore';

interface GenerationState {
  prompt: string;
  isGenerating: boolean;
  results: ImageResult[];
  error: string | null;
  activeProviderId: string | null;
  activeModelId: string | null;

  setPrompt: (prompt: string) => void;
  setActiveProvider: (providerId: string) => void;
  setActiveModel: (modelId: string | null) => void;
  generate: () => Promise<void>;
  retryGenerate: (prompt: string) => Promise<void>;
  removeResult: (result: ImageResult) => void;
  clearError: () => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  prompt: '',
  isGenerating: false,
  results: [],
  error: null,
  activeProviderId: null,
  activeModelId: null,

  setPrompt: (prompt) => set({ prompt }),

  setActiveProvider: (providerId) => {
    providerManager.switchTo(providerId);
    set({ activeProviderId: providerId, activeModelId: null });
  },

  setActiveModel: (modelId) => set({ activeModelId: modelId }),

  generate: async () => {
    const { prompt, activeProviderId, activeModelId } = get();
    if (!prompt.trim()) return;

    // 阿里云必须选择模型才能生成
    if (activeProviderId === 'aliyun' && !activeModelId) {
      set({ error: '请先在模型选择器中选择一个模型' });
      return;
    }

    set({ isGenerating: true, error: null });

    try {
      let result: ImageResult;

      // Electron 环境：通过 IPC → 主进程调用 API
      if (typeof window !== 'undefined' && window.electronAPI?.generateImage) {
        const options: Record<string, unknown> = {};
        if (activeModelId) options.model = activeModelId;

        const res = await window.electronAPI.generateImage({
          prompt,
          providerId: activeProviderId ?? undefined,
          options,
        });
        const data = res as { status?: string; data?: ImageResult; message?: string };
        if (data.status === 'error' || !data.data) {
          throw new Error(data.message ?? '生成失败');
        }
        result = data.data;
      } else {
        // Web 模式：通过 ProviderManager
        result = await providerManager.generate(prompt);
      }

      const updated = persistenceStore.addResult(result);
      set({
        results: updated,
        activeProviderId: result.provider,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成失败，请重试';
      set({ error: message });
    } finally {
      set({ isGenerating: false });
    }
  },

  retryGenerate: async (prompt: string) => {
    const { activeProviderId, activeModelId } = get();

    // 阿里云必须选择模型才能生成
    if (activeProviderId === 'aliyun' && !activeModelId) {
      set({ error: '请先在模型选择器中选择一个模型' });
      return;
    }

    set({ isGenerating: true, error: null });

    try {
      let result: ImageResult;

      if (typeof window !== 'undefined' && window.electronAPI?.generateImage) {
        const options: Record<string, unknown> = {};
        if (activeModelId) options.model = activeModelId;

        const res = await window.electronAPI.generateImage({
          prompt,
          providerId: activeProviderId ?? undefined,
          options,
        });
        const data = res as { status?: string; data?: ImageResult; message?: string };
        if (data.status === 'error' || !data.data) {
          throw new Error(data.message ?? '生成失败');
        }
        result = data.data;
      } else {
        result = await providerManager.generate(prompt);
      }

      const updated = persistenceStore.addResult(result);
      set({
        results: updated,
        activeProviderId: result.provider,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '重新生成失败，请重试';
      set({ error: message });
    } finally {
      set({ isGenerating: false });
    }
  },

  removeResult: (result) => {
    const filtered = get().results.filter(
      (r) => r.url !== result.url && r.metadata.generatedAt !== result.metadata.generatedAt,
    );
    set({ results: filtered });
  },

  clearError: () => set({ error: null }),
}));

// 启动时异步加载结果（优先从主进程文件，fallback localStorage）
persistenceStore.loadAsync().then((results) => {
  if (results.length > 0) {
    useGenerationStore.setState({ results });
  }
});

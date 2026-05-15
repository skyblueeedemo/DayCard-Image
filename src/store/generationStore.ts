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

  setPrompt: (prompt: string) => void;
  setActiveProvider: (providerId: string) => void;
  generate: () => Promise<void>;
  retryGenerate: (prompt: string) => Promise<void>;
  clearError: () => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  prompt: '',
  isGenerating: false,
  results: persistenceStore.load(),
  error: null,
  activeProviderId: null,

  setPrompt: (prompt) => set({ prompt }),

  setActiveProvider: (providerId) => {
    providerManager.switchTo(providerId);
    set({ activeProviderId: providerId });
  },

  generate: async () => {
    const { prompt } = get();
    if (!prompt.trim()) return;

    set({ isGenerating: true, error: null });

    try {
      const result = await providerManager.generate(prompt);
      const updated = persistenceStore.addResult(result);
      set({
        results: updated,
        activeProviderId: providerManager.getCurrentProviderId(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成失败，请重试';
      set({ error: message });
    } finally {
      set({ isGenerating: false });
    }
  },

  retryGenerate: async (prompt: string) => {
    set({ isGenerating: true, error: null });

    try {
      const result = await providerManager.generate(prompt);
      const updated = persistenceStore.addResult(result);
      set({
        results: updated,
        activeProviderId: providerManager.getCurrentProviderId(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '重新生成失败，请重试';
      set({ error: message });
    } finally {
      set({ isGenerating: false });
    }
  },

  clearError: () => set({ error: null }),
}));

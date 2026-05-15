import { describe, it, expect, beforeEach, vi } from 'vitest';

// 变量必须在 vi.mock 之前定义（hoisted）
const { mockGenerate, mockSwitchTo, mockGetCurrentProviderId } = vi.hoisted(() => ({
  mockGenerate: vi.fn(),
  mockSwitchTo: vi.fn(),
  mockGetCurrentProviderId: vi.fn(() => 'mock'),
}));

vi.mock('../persistenceStore', () => ({
  persistenceStore: {
    load: vi.fn(() => []),
    save: vi.fn(),
    addResult: vi.fn((result) => [result]),
    clearAll: vi.fn(),
  },
}));

vi.mock('@/providers/ProviderManager', () => ({
  providerManager: {
    register: vi.fn(),
    unregister: vi.fn(),
    switchTo: mockSwitchTo,
    generate: mockGenerate,
    getCurrentProviderId: mockGetCurrentProviderId,
    listProviders: vi.fn(() => []),
    getQuota: vi.fn(),
    getAllQuotas: vi.fn(() => new Map()),
  },
}));

import { useGenerationStore } from '../generationStore';

describe('generationStore', () => {
  beforeEach(() => {
    useGenerationStore.setState({
      prompt: '',
      isGenerating: false,
      results: [],
      error: null,
      activeProviderId: null,
    });
    vi.clearAllMocks();
  });

  describe('setPrompt', () => {
    it('should update prompt', () => {
      useGenerationStore.getState().setPrompt('hello');
      expect(useGenerationStore.getState().prompt).toBe('hello');
    });
  });

  describe('setActiveProvider', () => {
    it('should update active provider and call switchTo', () => {
      useGenerationStore.getState().setActiveProvider('openai');
      expect(mockSwitchTo).toHaveBeenCalledWith('openai');
      expect(useGenerationStore.getState().activeProviderId).toBe('openai');
    });
  });

  describe('generate', () => {
    it('should not generate with empty prompt', async () => {
      await useGenerationStore.getState().generate();
      expect(mockGenerate).not.toHaveBeenCalled();
    });

    it('should set isGenerating during generation', async () => {
      mockGenerate.mockResolvedValueOnce({
        url: 'https://example.com/img.png',
        provider: 'mock',
        cost: 0,
        metadata: {
          prompt: 'hello',
          generatedAt: new Date().toISOString(),
          width: 1024,
          height: 1024,
        },
      });

      useGenerationStore.getState().setPrompt('hello');
      const promise = useGenerationStore.getState().generate();
      expect(useGenerationStore.getState().isGenerating).toBe(true);
      await promise;
      expect(useGenerationStore.getState().isGenerating).toBe(false);
    });

    it('should add result after successful generation', async () => {
      mockGenerate.mockResolvedValueOnce({
        url: 'https://example.com/img.png',
        provider: 'mock',
        cost: 0,
        metadata: {
          prompt: 'hello',
          generatedAt: new Date().toISOString(),
          width: 1024,
          height: 1024,
        },
      });

      useGenerationStore.getState().setPrompt('hello');
      await useGenerationStore.getState().generate();
      expect(useGenerationStore.getState().results).toHaveLength(1);
      expect(useGenerationStore.getState().results[0].url).toBe('https://example.com/img.png');
    });

    it('should set error on generation failure', async () => {
      mockGenerate.mockRejectedValueOnce(new Error('API error'));

      useGenerationStore.getState().setPrompt('hello');
      await useGenerationStore.getState().generate();
      expect(useGenerationStore.getState().error).toBe('API error');
      expect(useGenerationStore.getState().isGenerating).toBe(false);
    });
  });

  describe('retryGenerate', () => {
    it('should use provided prompt for retry', async () => {
      mockGenerate.mockResolvedValueOnce({
        url: 'https://example.com/retry.png',
        provider: 'mock',
        cost: 0,
        metadata: {
          prompt: 'retry prompt',
          generatedAt: new Date().toISOString(),
          width: 1024,
          height: 1024,
        },
      });

      await useGenerationStore.getState().retryGenerate('retry prompt');
      expect(mockGenerate).toHaveBeenCalledWith('retry prompt');
      expect(useGenerationStore.getState().results).toHaveLength(1);
    });

    it('should set error on retry failure', async () => {
      mockGenerate.mockRejectedValueOnce(new Error('retry failed'));

      await useGenerationStore.getState().retryGenerate('test');
      expect(useGenerationStore.getState().error).toBe('retry failed');
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      useGenerationStore.setState({ error: 'some error' });
      useGenerationStore.getState().clearError();
      expect(useGenerationStore.getState().error).toBeNull();
    });
  });
});

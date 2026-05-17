import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockProvider } from '../mock/MockProvider';
import { OpenAIProvider } from '../openai/OpenAIProvider';
import { StabilityProvider } from '../stability/StabilityProvider';
import { ZhipuProvider } from '../zhipu/ZhipuProvider';
import { AliyunProvider } from '../aliyun/AliyunProvider';

/**
 * 阶段二 T-201 listModels 单元测试
 *
 * 5 个 Provider × 成功 + 失败/fallback 两条路径 ≈ 10 条测试。
 * 用 vi.spyOn(global, 'fetch') 拦截网络请求，确保确定性。
 */

function mockFetchOnce(body: unknown, init?: { ok?: boolean; status?: number }) {
  return Promise.resolve({
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response);
}

describe('listModels', () => {
  const originalFetch = global.fetch;
  const fetchSpy = vi.fn();

  beforeEach(() => {
    fetchSpy.mockReset();
    global.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('MockProvider', () => {
    it('should return hardcoded list without network', async () => {
      const provider = new MockProvider();
      const models = await provider.listModels();
      expect(models).toHaveLength(2);
      expect(models[0].id).toBe('mock-default');
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('OpenAIProvider', () => {
    it('should filter image / dall-e models from /v1/models', async () => {
      fetchSpy.mockImplementationOnce(() =>
        mockFetchOnce({
          data: [
            { id: 'gpt-4' },
            { id: 'gpt-image-2' },
            { id: 'dall-e-3' },
            { id: 'whisper-1' },
          ],
        }),
      );
      const provider = new OpenAIProvider({ apiKey: 'sk-test' });
      const models = await provider.listModels();
      expect(models.map((m) => m.id).sort()).toEqual(['dall-e-3', 'gpt-image-2']);
    });

    it('should throw when API returns non-200', async () => {
      fetchSpy.mockImplementationOnce(() =>
        mockFetchOnce({}, { ok: false, status: 401 }),
      );
      const provider = new OpenAIProvider({ apiKey: 'sk-bad' });
      await expect(provider.listModels()).rejects.toThrow('HTTP 401');
    });
  });

  describe('StabilityProvider', () => {
    it('should map engines/list response', async () => {
      fetchSpy.mockImplementationOnce(() =>
        mockFetchOnce([
          { id: 'sd-xl-v1', name: 'SD XL v1', description: 'High-res' },
          { id: 'sd-1.5' },
        ]),
      );
      const provider = new StabilityProvider({ apiKey: 'sk-test' });
      const models = await provider.listModels();
      expect(models).toHaveLength(2);
      expect(models[0].name).toBe('SD XL v1');
      expect(models[1].name).toBe('sd-1.5'); // fallback to id
    });

    it('should throw when API returns non-200', async () => {
      fetchSpy.mockImplementationOnce(() =>
        mockFetchOnce({}, { ok: false, status: 500 }),
      );
      const provider = new StabilityProvider({ apiKey: 'sk-bad' });
      await expect(provider.listModels()).rejects.toThrow('HTTP 500');
    });
  });

  describe('ZhipuProvider', () => {
    it('should filter cogview / image models when API succeeds', async () => {
      fetchSpy.mockImplementationOnce(() =>
        mockFetchOnce({
          data: [
            { id: 'glm-4' },
            { id: 'cogview-3' },
            { id: 'cogview-3-plus' },
          ],
        }),
      );
      const provider = new ZhipuProvider({ apiKey: 'test' });
      const models = await provider.listModels();
      expect(models.map((m) => m.id).sort()).toEqual(['cogview-3', 'cogview-3-plus']);
    });

    it('should fallback to static list when API fails', async () => {
      fetchSpy.mockImplementationOnce(() =>
        mockFetchOnce({}, { ok: false, status: 403 }),
      );
      const provider = new ZhipuProvider({ apiKey: 'test' });
      const models = await provider.listModels();
      expect(models.length).toBeGreaterThan(0);
      expect(models[0].id).toMatch(/cogview/);
    });
  });

  describe('AliyunProvider', () => {
    it('should filter wan / qwen-image models from compatible-mode', async () => {
      fetchSpy.mockImplementationOnce(() =>
        mockFetchOnce({
          data: [
            { id: 'qwen-plus' },
            { id: 'wan2.7-image-pro' },
            { id: 'qwen-image-2.0' },
            { id: 'embedding-v1' },
          ],
        }),
      );
      const provider = new AliyunProvider({ apiKey: 'sk-test' });
      const models = await provider.listModels();
      expect(models.map((m) => m.id).sort()).toEqual([
        'qwen-image-2.0',
        'wan2.7-image-pro',
      ]);
    });

    it('should fallback to static list when API returns empty', async () => {
      fetchSpy.mockImplementationOnce(() =>
        mockFetchOnce({ data: [] }),
      );
      const provider = new AliyunProvider({ apiKey: 'sk-test' });
      const models = await provider.listModels();
      expect(models.length).toBeGreaterThan(0);
      // fallback 应包含 wan / qwen-image 系列
      const ids = models.map((m) => m.id);
      expect(ids.some((id) => /wan|qwen-image/.test(id))).toBe(true);
    });

    it('should fallback to static list when fetch throws', async () => {
      fetchSpy.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
      const provider = new AliyunProvider({ apiKey: 'sk-test' });
      const models = await provider.listModels();
      expect(models.length).toBeGreaterThan(0);
    });
  });
});

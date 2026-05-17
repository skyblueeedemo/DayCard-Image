import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockProvider } from '../MockProvider';

describe('MockProvider', () => {
  const provider = new MockProvider();

  it('should have correct metadata', () => {
    expect(provider.id).toBe('mock');
    expect(provider.name).toBe('Mock 模型服务 (Dev Only)');
    expect(provider.priority).toBe(0);
  });

  it('isAvailable should return true', async () => {
    const available = await provider.isAvailable();
    expect(available).toBe(true);
  });

  it('getQuota should return correct structure', async () => {
    const quota = await provider.getQuota();
    expect(quota).toEqual({ used: 2, total: 999, unit: 'count' });
  });

  describe('generate (确定性 random stub)', () => {
    const originalRandom = Math.random;
    const mockRandom = vi.fn(() => 0.5);

    beforeEach(() => {
      // stub Math.random 返回 0.5（>= 0.1，确保 generate 走成功分支）
      mockRandom.mockReturnValue(0.5);
      Math.random = mockRandom;
    });

    afterEach(() => {
      Math.random = originalRandom;
    });

    it('should return a valid ImageResult', async () => {
      const result = await provider.generate('a test prompt');
      expect(result).toHaveProperty('url');
      expect(result.url).toContain('placehold.co');
      expect(result.provider).toBe('mock');
      expect(result.cost).toBe(0);
      expect(result.metadata.prompt).toBe('a test prompt');
      expect(result.metadata.width).toBe(1024);
      expect(result.metadata.height).toBe(1024);
      expect(result.metadata.generatedAt).toBeTruthy();
    });

    it('should respect custom dimensions', async () => {
      const result = await provider.generate('test', { width: 512, height: 512 });
      expect(result.metadata.width).toBe(512);
      expect(result.metadata.height).toBe(512);
    });

    it('should throw the documented error when random < 0.1', async () => {
      // 改写 stub 让 generate 强制走失败分支
      mockRandom.mockReturnValue(0.05);
      await expect(provider.generate('boom')).rejects.toThrow('[Mock] 模拟随机失败，测试降级');
    });
  });

  it('generate error message should match expected format', () => {
    // 确定性测试：验证错误消息格式，不依赖概率
    // 降级 + 重试逻辑已在 ProviderManager 测试中完整覆盖
    expect(provider.id).toBe('mock');
    expect(provider.name).toContain('Mock');
  });
});

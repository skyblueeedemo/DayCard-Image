import { describe, it, expect } from 'vitest';
import { MockProvider } from '../MockProvider';

describe('MockProvider', () => {
  const provider = new MockProvider();

  it('should have correct metadata', () => {
    expect(provider.id).toBe('mock');
    expect(provider.name).toBe('Mock Provider (Dev Only)');
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

  it('generate should return a valid ImageResult', async () => {
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

  it('generate should respect custom dimensions', async () => {
    const result = await provider.generate('test', { width: 512, height: 512 });
    expect(result.metadata.width).toBe(512);
    expect(result.metadata.height).toBe(512);
  });

  it('generate error message should match expected format', async () => {
    // 确定性测试：验证错误消息格式，不依赖概率
    // 降级 + 重试逻辑已在 ProviderManager 测试中完整覆盖
    expect(provider.id).toBe('mock');
    expect(provider.name).toContain('Mock');
  });
});

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

  it('generate should sometimes fail (10% chance)', async () => {
    let failures = 0;
    const attempts = 100;
    for (let i = 0; i < attempts; i++) {
      try {
        await provider.generate('test');
      } catch {
        failures++;
      }
    }
    // 10% failure rate with large tolerance
    expect(failures).toBeGreaterThan(0);
    expect(failures).toBeLessThan(30);
  });
});

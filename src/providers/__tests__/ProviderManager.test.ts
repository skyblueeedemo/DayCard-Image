import { describe, it, expect, beforeEach } from 'vitest';
import type { IImageProvider, ImageResult, GenerateOptions, QuotaInfo } from '../IImageProvider';
import { ProviderManager } from '../ProviderManager';

// 可控制的测试用 Provider
class TestProvider implements IImageProvider {
  readonly id: string;
  readonly name: string;
  readonly priority: number;
  private shouldFail: boolean;
  private available: boolean;

  constructor(id: string, priority: number, shouldFail = false, available = true) {
    this.id = id;
    this.name = `Test ${id}`;
    this.priority = priority;
    this.shouldFail = shouldFail;
    this.available = available;
  }

  setFail(fail: boolean) { this.shouldFail = fail; }
  setAvailable(avail: boolean) { this.available = avail; }

  async generate(prompt: string): Promise<ImageResult> {
    if (this.shouldFail) throw new Error(`[${this.id}] forced failure`);
    return {
      url: `https://example.com/${this.id}.png`,
      provider: this.id,
      cost: 0,
      metadata: { prompt, generatedAt: new Date().toISOString(), width: 1024, height: 1024 },
    };
  }

  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  async getQuota(): Promise<QuotaInfo> {
    return { used: 0, total: 10, unit: 'count' };
  }
}

describe('ProviderManager', () => {
  let manager: ProviderManager;

  beforeEach(() => {
    manager = new ProviderManager();
  });

  describe('register', () => {
    it('should register a provider and set as current if first', () => {
      const p = new TestProvider('a', 1);
      manager.register(p);
      expect(manager.listProviders()).toHaveLength(1);
      expect(manager.getCurrentProviderId()).toBe('a');
    });

    it('should sort providers by priority', () => {
      manager.register(new TestProvider('low', 10));
      manager.register(new TestProvider('high', 1));
      const list = manager.listProviders();
      expect(list[0].id).toBe('high');
      expect(list[1].id).toBe('low');
    });

    it('should throw on duplicate id', () => {
      manager.register(new TestProvider('a', 1));
      expect(() => manager.register(new TestProvider('a', 2))).toThrow('已存在');
    });
  });

  describe('unregister', () => {
    it('should remove provider and update current', () => {
      manager.register(new TestProvider('a', 1));
      manager.register(new TestProvider('b', 2));
      manager.unregister('a');
      expect(manager.listProviders()).toHaveLength(1);
      expect(manager.getCurrentProviderId()).toBe('b');
    });

    it('should set current to null when last removed', () => {
      manager.register(new TestProvider('a', 1));
      manager.unregister('a');
      expect(manager.getCurrentProviderId()).toBeNull();
    });
  });

  describe('switchTo', () => {
    it('should switch active provider', () => {
      manager.register(new TestProvider('a', 1));
      manager.register(new TestProvider('b', 2));
      manager.switchTo('b');
      expect(manager.getCurrentProviderId()).toBe('b');
    });

    it('should throw on unknown provider', () => {
      expect(() => manager.switchTo('nope')).toThrow('未注册');
    });
  });

  describe('generate', () => {
    it('should return result from available provider', async () => {
      const p = new TestProvider('a', 1);
      manager.register(p);
      const result = await manager.generate('test prompt');
      expect(result.provider).toBe('a');
      expect(result.url).toContain('a.png');
    });

    it('should fallback to next provider on failure', async () => {
      const p1 = new TestProvider('a', 1, true); // fails
      const p2 = new TestProvider('b', 2);
      manager.register(p1);
      manager.register(p2);
      const result = await manager.generate('test');
      expect(result.provider).toBe('b');
    });

    it('should throw when all providers fail', async () => {
      manager.register(new TestProvider('a', 1, true));
      manager.register(new TestProvider('b', 2, true));
      await expect(manager.generate('test')).rejects.toThrow('所有 Provider 均生成失败');
    });

    it('should throw when no providers available', async () => {
      const p = new TestProvider('a', 1, false, false); // unavailable
      manager.register(p);
      await expect(manager.generate('test')).rejects.toThrow('所有 Provider 均不可用');
    });

    it('should update currentProviderId after successful generation', async () => {
      manager.register(new TestProvider('a', 1, true));
      manager.register(new TestProvider('b', 2));
      await manager.generate('test');
      expect(manager.getCurrentProviderId()).toBe('b');
    });
  });

  describe('getQuota', () => {
    it('should return quota for registered provider', async () => {
      manager.register(new TestProvider('a', 1));
      const quota = await manager.getQuota('a');
      expect(quota.used).toBe(0);
      expect(quota.total).toBe(10);
    });

    it('should throw for unknown provider', async () => {
      await expect(manager.getQuota('nope')).rejects.toThrow('未注册');
    });
  });

  describe('getAllQuotas', () => {
    it('should return quotas for all providers', async () => {
      manager.register(new TestProvider('a', 1));
      manager.register(new TestProvider('b', 2));
      const quotas = await manager.getAllQuotas();
      expect(quotas.size).toBe(2);
      expect(quotas.get('a')?.total).toBe(10);
    });
  });
});

import type { IImageProvider, ImageResult, GenerateOptions, QuotaInfo } from './IImageProvider';

const RETRY_CONFIG = {
  maxAttempts: 3,
  backoffMs: [1000, 2000, 4000],
  retryOnStatus: [429, 500, 502, 503],
};

export class ProviderManager {
  private providers: IImageProvider[] = [];
  private currentProviderId: string | null = null;

  /** 注册一个 Provider */
  register(provider: IImageProvider): void {
    const exists = this.providers.find((p) => p.id === provider.id);
    if (exists) {
      throw new Error(`Provider "${provider.id}" 已存在`);
    }
    this.providers.push(provider);
    this.providers.sort((a, b) => a.priority - b.priority);

    if (!this.currentProviderId) {
      this.currentProviderId = provider.id;
    }
  }

  /** 注销一个 Provider */
  unregister(providerId: string): void {
    this.providers = this.providers.filter((p) => p.id !== providerId);
    if (this.currentProviderId === providerId) {
      this.currentProviderId = this.providers[0]?.id ?? null;
    }
  }

  /** 手动切换当前 Provider */
  switchTo(providerId: string): void {
    const provider = this.providers.find((p) => p.id === providerId);
    if (!provider) {
      throw new Error(`Provider "${providerId}" 未注册`);
    }
    this.currentProviderId = providerId;
  }

  /** 获取所有已注册 Provider */
  listProviders(): IImageProvider[] {
    return [...this.providers];
  }

  /** 获取当前 Provider ID */
  getCurrentProviderId(): string | null {
    return this.currentProviderId;
  }

  /**
   * 核心生成方法：按优先级降级尝试
   * - 逐一尝试可用 Provider，失败自动切换
   * - 所有 Provider 都失败时抛出异常
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<ImageResult> {
    const available = await this.getAvailableProviders();

    if (available.length === 0) {
      throw new Error('所有 Provider 均不可用，请检查网络或配额');
    }

    let lastError: Error | null = null;

    for (const provider of available) {
      for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
        try {
          const result = await provider.generate(prompt, options);
          this.currentProviderId = provider.id;
          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(
            `[ProviderManager] ${provider.id} 第 ${attempt}/${RETRY_CONFIG.maxAttempts} 次尝试失败:`,
            lastError.message,
          );

          if (attempt < RETRY_CONFIG.maxAttempts) {
            const delay = RETRY_CONFIG.backoffMs[attempt - 1] ?? 4000;
            await this.sleep(delay);
          }
        }
      }
      console.warn(`[ProviderManager] ${provider.id} 尝试所有重试仍失败，降级到下一个`);
    }

    throw new Error(
      `所有 Provider 均生成失败${lastError ? `: ${lastError.message}` : ''}`,
    );
  }

  /** 获取单个 Provider 的配额 */
  async getQuota(providerId: string): Promise<QuotaInfo> {
    const provider = this.providers.find((p) => p.id === providerId);
    if (!provider) {
      throw new Error(`Provider "${providerId}" 未注册`);
    }
    return provider.getQuota();
  }

  /** 获取所有 Provider 的配额 */
  async getAllQuotas(): Promise<Map<string, QuotaInfo>> {
    const map = new Map<string, QuotaInfo>();
    await Promise.all(
      this.providers.map(async (p) => {
        try {
          map.set(p.id, await p.getQuota());
        } catch {
          map.set(p.id, { used: 0, total: 0, unit: 'count' });
        }
      }),
    );
    return map;
  }

  // ─── Private ──────────────────────────────────────────

  private async getAvailableProviders(): Promise<IImageProvider[]> {
    const checks = await Promise.all(
      this.providers.map(async (p) => {
        try {
          return { provider: p, ok: await p.isAvailable() };
        } catch {
          return { provider: p, ok: false };
        }
      }),
    );
    return checks
      .filter((c) => c.ok)
      .map((c) => c.provider)
      .sort((a, b) => a.priority - b.priority);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/** 全局单例 */
export const providerManager = new ProviderManager();

import type { IImageProvider, ImageResult, GenerateOptions, QuotaInfo } from '../IImageProvider';
import { storageAdapter } from '@/store/storageAdapter';

const QUOTA_STORAGE_KEY = 'daycard-quota-openai';

interface OpenAIQuotaState {
  used: number;
  date: string; // YYYY-MM-DD（本地时间）
}

interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

/**
 * OpenAI GPT-image-2 Provider
 * - 优先级：最高 (1)，默认主通道
 * - 每日免费 5 张
 * - 使用 OpenAI SDK 调用
 *
 * 注意：
 * - 配额状态通过 storageAdapter 持久化到 localStorage（key: daycard-quota-openai）
 * - Electron 环境下生成实际走 IPC + QuotaService（已持久化），
 *   本类的 dailyUsed 主要影响 Web 模式 + 注册表展示侧的 getQuota()
 */
export class OpenAIProvider implements IImageProvider {
  readonly id = 'openai';
  readonly name = 'GPT-image-2';
  readonly priority = 1;

  private config: OpenAIConfig;
  private dailyUsed = 0;
  private dailyLimit = 5;
  private lastResetDate = '';

  constructor(config: OpenAIConfig) {
    this.config = {
      model: 'gpt-image-2',
      baseURL: 'https://api.openai.com/v1',
      ...config,
    };
    this.hydrateQuota();
    this.checkDailyReset();
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<ImageResult> {
    this.checkDailyReset();

    if (this.dailyUsed >= this.dailyLimit) {
      throw new Error(
        `[${this.name}] 今日免费额度已用尽 (${this.dailyUsed}/${this.dailyLimit})`,
      );
    }

    // 构建请求体
    const body: Record<string, unknown> = {
      model: this.config.model,
      prompt,
      n: options?.n ?? 1,
      size: this.mapSize(options?.width, options?.height),
      quality: options?.quality ?? 'standard',
      response_format: 'url',
    };

    if (options?.style) {
      body.style = options.style;
    }

    const response = await fetch(`${this.config.baseURL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `[${this.name}] API 返回错误 ${response.status}: ${errorText}`,
      );
    }

    const data = await response.json();

    // 扣减配额
    this.dailyUsed += 1;
    this.persistQuota();

    const imageData = data.data?.[0];
    if (!imageData?.url) {
      throw new Error(`[${this.name}] 响应中无图像 URL`);
    }

    return {
      url: imageData.url,
      provider: this.id,
      cost: this.dailyUsed <= this.dailyLimit ? 0 : 1, // 免费额度内 cost=0
      metadata: {
        prompt,
        generatedAt: new Date().toISOString(),
        width: options?.width ?? 1024,
        height: options?.height ?? 1024,
      },
    };
  }

  async isAvailable(): Promise<boolean> {
    this.checkDailyReset();
    if (this.dailyUsed >= this.dailyLimit) {
      return false;
    }

    try {
      // 轻量探活：调一次 models 列表
      const res = await fetch(`${this.config.baseURL}/models`, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getQuota(): Promise<QuotaInfo> {
    this.checkDailyReset();
    return {
      used: this.dailyUsed,
      total: this.dailyLimit,
      resetAt: this.getNextResetTime(),
      unit: 'count',
    };
  }

  // ─── Private ──────────────────────────────────────────

  private mapSize(width?: number, height?: number): string {
    if (!width || !height) return '1024x1024';
    // OpenAI DALL·E 支持的尺寸
    const supported = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
    const dim = `${width}x${height}`;
    return supported.includes(dim) ? dim : '1024x1024';
  }

  private checkDailyReset(): void {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (this.lastResetDate !== today) {
      this.dailyUsed = 0;
      this.lastResetDate = today;
      this.persistQuota();
    }
  }

  /**
   * 启动时从 storageAdapter 恢复配额状态。
   * 若日期已变化，hydrate 后随即被 checkDailyReset 重置。
   */
  private hydrateQuota(): void {
    const stored = storageAdapter.getJSON<OpenAIQuotaState | null>(QUOTA_STORAGE_KEY, null);
    if (stored && typeof stored.used === 'number' && typeof stored.date === 'string') {
      this.dailyUsed = stored.used;
      this.lastResetDate = stored.date;
    }
  }

  private persistQuota(): void {
    const state: OpenAIQuotaState = {
      used: this.dailyUsed,
      date: this.lastResetDate,
    };
    storageAdapter.setJSON(QUOTA_STORAGE_KEY, state);
  }

  private getNextResetTime(): string {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(24, 0, 0, 0);
    return next.toISOString();
  }
}

import type { IImageProvider, ImageResult, GenerateOptions, QuotaInfo } from '../IImageProvider';

interface ZhipuConfig {
  apiKey: string;
  model?: string;
}

export class ZhipuProvider implements IImageProvider {
  readonly id = 'zhipu';
  readonly name = '智谱 CogView';
  readonly priority = 3;

  private config: ZhipuConfig;

  constructor(config: ZhipuConfig) {
    this.config = {
      model: 'cogview-3',
      ...config,
    };
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<ImageResult> {
    const body = {
      model: this.config.model,
      prompt,
      size: this.mapSize(options?.width, options?.height),
    };

    const response = await fetch(
      'https://open.bigmodel.cn/api/paas/v4/images/generations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `[${this.name}] API 返回错误 ${response.status}: ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      data?: { url?: string }[];
    };

    const imageUrl = data.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error(`[${this.name}] 响应中无图像 URL`);
    }

    return {
      url: imageUrl,
      provider: this.id,
      cost: 1,
      metadata: {
        prompt,
        generatedAt: new Date().toISOString(),
        width: options?.width ?? 1024,
        height: options?.height ?? 1024,
      },
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      // 轻量探活：获取模型列表
      const res = await fetch(
        'https://open.bigmodel.cn/api/paas/v4/models',
        {
          headers: { Authorization: `Bearer ${this.config.apiKey}` },
        },
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  async getQuota(): Promise<QuotaInfo> {
    // 智谱按量计费
    return { used: 0, total: Infinity, unit: 'credit' };
  }

  private mapSize(width?: number, height?: number): string {
    const supported = ['1024x1024', '768x1344', '1344x768'];
    const dim = `${width ?? 1024}x${height ?? 1024}`;
    return supported.includes(dim) ? dim : '1024x1024';
  }
}

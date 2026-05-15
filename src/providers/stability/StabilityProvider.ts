import type { IImageProvider, ImageResult, GenerateOptions, QuotaInfo } from '../IImageProvider';

interface StabilityConfig {
  apiKey: string;
  engineId?: string;
}

export class StabilityProvider implements IImageProvider {
  readonly id = 'stability';
  readonly name = 'Stability AI';
  readonly priority = 2;

  private config: StabilityConfig;

  constructor(config: StabilityConfig) {
    this.config = {
      engineId: 'stable-diffusion-xl-1024-v1-0',
      ...config,
    };
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<ImageResult> {
    const engineId = this.config.engineId!;
    const url = `https://api.stability.ai/v1/generation/${engineId}/text-to-image`;

    const body = {
      text_prompts: [{ text: prompt, weight: 1 }],
      cfg_scale: 7,
      height: options?.height ?? 1024,
      width: options?.width ?? 1024,
      samples: options?.n ?? 1,
      steps: 30,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `[${this.name}] API 返回错误 ${response.status}: ${errorText}`,
      );
    }

    const data = await response.json() as {
      artifacts?: { base64?: string; finishReason?: string }[];
    };

    const artifact = data.artifacts?.[0];
    if (!artifact?.base64) {
      throw new Error(`[${this.name}] 响应中无图像数据`);
    }

    if (artifact.finishReason && artifact.finishReason !== 'SUCCESS') {
      throw new Error(
        `[${this.name}] 生成未成功完成: ${artifact.finishReason}`,
      );
    }

    return {
      url: `data:image/png;base64,${artifact.base64}`,
      provider: this.id,
      cost: 1, // 按量计费，每次消耗 1 credit
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
      const res = await fetch('https://api.stability.ai/v1/engines/list', {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getQuota(): Promise<QuotaInfo> {
    // Stability AI 按量计费，无硬上限
    return { used: 0, total: Infinity, unit: 'credit' };
  }
}

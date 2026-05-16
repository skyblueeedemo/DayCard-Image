import type { IImageProvider, ImageResult, GenerateOptions, QuotaInfo } from '../IImageProvider';

export class MockProvider implements IImageProvider {
  readonly id = 'mock';
  readonly name = 'Mock 模型服务 (Dev Only)';
  readonly priority = 0;

  private mockImageUrl = 'https://placehold.co/1024x1024/a78bfa/ffffff?text=MOCK';
  private delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  async generate(prompt: string, options?: GenerateOptions): Promise<ImageResult> {
    await this.delay(800);

    if (Math.random() < 0.1) {
      throw new Error('[Mock] 模拟随机失败，测试降级');
    }

    return {
      url: this.mockImageUrl,
      provider: this.id,
      cost: 0,
      metadata: {
        prompt,
        generatedAt: new Date().toISOString(),
        width: options?.width ?? 1024,
        height: options?.height ?? 1024,
      },
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getQuota(): Promise<QuotaInfo> {
    return { used: 2, total: 999, unit: 'count' };
  }
}

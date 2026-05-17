import type { IImageProvider, ImageResult, GenerateOptions, QuotaInfo, ModelMeta } from '../IImageProvider';

interface AliyunConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
}

const DEFAULT_BASE_URL = 'https://dashscope.aliyuncs.com';
const TASK_PATH = '/api/v1/services/aigc/text2image/image-synthesis';

export class AliyunProvider implements IImageProvider {
  readonly id = 'aliyun';
  readonly name = '阿里云通义万象';
  readonly priority = 4;

  private config: AliyunConfig;

  constructor(config: AliyunConfig) {
    this.config = {
      model: 'wanx2.0-t2i-turbo',
      baseURL: DEFAULT_BASE_URL,
      ...config,
    };
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<ImageResult> {
    const taskUrl = `${this.config.baseURL}${TASK_PATH}`;
    // 1. 提交异步任务
    const submitBody = {
      model: options?.model ?? this.config.model,
      input: { prompt },
      parameters: {
        size: this.mapSize(options?.width, options?.height),
        n: options?.n ?? 1,
      },
    };

    const submitRes = await fetch(taskUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify(submitBody),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      throw new Error(
        `[${this.name}] 提交任务失败 ${submitRes.status}: ${errorText}`,
      );
    }

    const submitData = (await submitRes.json()) as {
      output?: { task_id?: string; task_status?: string };
      message?: string;
    };

    const taskId = submitData.output?.task_id;
    if (!taskId) {
      throw new Error(
        `[${this.name}] 未获取到任务 ID: ${submitData.message ?? '未知错误'}`,
      );
    }

    // 2. 轮询任务结果（最多 30 次，每次间隔 2 秒）
    const imageUrl = await this.pollTask(taskId);

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
      const res = await fetch(
        `${this.config.baseURL}${TASK_PATH}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.model,
            input: { prompt: 'test' },
            parameters: { size: '1024*1024', n: 1 },
          }),
        },
      );
      return res.ok || res.status === 400; // 400 表示 API Key 有效但请求格式问题
    } catch {
      return false;
    }
  }

  async getQuota(): Promise<QuotaInfo> {
    return { used: 0, total: Infinity, unit: 'credit' };
  }

  /**
   * 调用 DashScope OpenAI 兼容接口拉取模型列表，过滤出图像模型。
   * 失败时 fallback 到静态硬编码列表。
   */
  async listModels(): Promise<ModelMeta[]> {
    try {
      const res = await fetch(`${this.config.baseURL}/compatible-mode/v1/models`, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: { id: string }[] };
        const all = json.data ?? [];
        const filtered = all
          .filter((m) => /^(wan|wanx|qwen-image|z-image)/i.test(m.id))
          .map((m) => ({ id: m.id, name: m.id, raw: m }));
        if (filtered.length > 0) return filtered;
      }
    } catch {
      // 落到 fallback
    }
    return [
      { id: 'wan2.7-image-pro', name: 'wan2.7-image-pro', description: '文字渲染、品牌色、角色一致性' },
      { id: 'wan2.7-image', name: 'wan2.7-image', description: '生成速度更快，最高 2K' },
      { id: 'wanx2.0-t2i-turbo', name: 'wanx2.0-t2i-turbo', description: '通用图像生成（异步任务）' },
      { id: 'qwen-image-2.0-pro', name: 'qwen-image-2.0-pro', description: '负向提示词、多图变体' },
    ];
  }

  private mapSize(width?: number, height?: number): string {
    return `${width ?? 1024}*${height ?? 1024}`;
  }

  private async pollTask(taskId: string): Promise<string> {
    const maxAttempts = 30;
    const interval = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, interval));

      const res = await fetch(
        `${this.config.baseURL}/api/v1/tasks/${taskId}`,
        {
          headers: { Authorization: `Bearer ${this.config.apiKey}` },
        },
      );

      if (!res.ok) continue;

      const data = (await res.json()) as {
        output?: {
          task_status?: string;
          results?: { url?: string }[];
        };
      };

      const status = data.output?.task_status;

      if (status === 'SUCCEEDED') {
        const url = data.output?.results?.[0]?.url;
        if (!url) throw new Error(`[${this.name}] 任务完成但无图像 URL`);
        return url;
      }

      if (status === 'FAILED') {
        throw new Error(`[${this.name}] 任务执行失败`);
      }
    }

    throw new Error(`[${this.name}] 任务超时，未在 ${maxAttempts * interval / 1000}s 内完成`);
  }
}

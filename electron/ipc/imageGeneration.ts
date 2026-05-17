import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { quotaService } from '../services/QuotaService';
import type { QuotaInfo } from '../services/QuotaService';
import { validateImageResult } from '../services/ImageValidator';

interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  engineId?: string;
}

interface Config {
  providers: Record<string, ProviderConfig>;
}

interface GenerateParams {
  prompt: string;
  providerId?: string;
  options?: Record<string, unknown>;
}

interface ProviderMeta {
  id: string;
  name: string;
  priority: number;
  available: boolean;
}

function loadConfig(): Config | null {
  const configPath = app.isPackaged
    ? path.join(app.getPath('userData'), 'config.json')
    : path.join(__dirname, '..', '..', 'config', 'local.json');
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// 获取所有可用 Provider 的元数据
function getProviders(): ProviderMeta[] {
  const config = loadConfig();
  const providers: ProviderMeta[] = [];

  // Mock 始终可用
  providers.push({ id: 'mock', name: 'Mock 模型服务 (Dev)', priority: 0, available: true });

  if (config?.providers.openai?.apiKey) {
    providers.push({ id: 'openai', name: 'GPT-image-2', priority: 1, available: true });
  }

  if (config?.providers.stability?.apiKey) {
    providers.push({ id: 'stability', name: 'Stability AI', priority: 2, available: true });
  }

  if (config?.providers.zhipu?.apiKey) {
    providers.push({ id: 'zhipu', name: '智谱 CogView', priority: 3, available: true });
  }

  if (config?.providers.aliyun?.apiKey) {
    providers.push({ id: 'aliyun', name: '阿里云通义万象', priority: 4, available: true });
  }

  return providers;
}

// Mock handler — 返回占位图
async function handleMock(_config: ProviderConfig, params: GenerateParams): Promise<Record<string, unknown>> {
  const width = 1024;
  const height = 1024;
  // 模拟 800ms 网络延迟
  await new Promise((r) => setTimeout(r, 800));
  return {
    url: `https://placehold.co/${width}x${height}/a78bfa/ffffff?text=MOCK`,
    provider: 'mock',
    cost: 0,
    metadata: {
      prompt: params.prompt,
      generatedAt: new Date().toISOString(),
      width,
      height,
    },
  };
}

async function handleOpenAI(config: ProviderConfig, params: GenerateParams): Promise<Record<string, unknown>> {
  const baseURL = config.baseURL ?? 'https://api.openai.com/v1';
  const model = config.model ?? 'gpt-image-2';

  const body = {
    model,
    prompt: params.prompt,
    n: (params.options?.n as number) ?? 1,
    size: (params.options?.size as string) ?? '1024x1024',
    quality: (params.options?.quality as string) ?? 'standard',
    response_format: 'url',
  };

  const response = await fetch(`${baseURL}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[openai] API 返回错误 ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { data?: { url?: string }[] };
  const imageUrl = data.data?.[0]?.url;

  if (!imageUrl) {
    throw new Error('[openai] 响应中无图像 URL');
  }

  return {
    url: imageUrl,
    provider: 'openai',
    cost: 0,
    metadata: {
      prompt: params.prompt,
      generatedAt: new Date().toISOString(),
      width: 1024,
      height: 1024,
    },
  };
}

async function handleStability(config: ProviderConfig, params: GenerateParams): Promise<Record<string, unknown>> {
  const baseURL = config.baseURL ?? 'https://api.stability.ai';
  const engineId = (params.options?.model as string) ?? config.engineId ?? 'stable-diffusion-xl-1024-v1-0';

  const body = {
    text_prompts: [{ text: params.prompt, weight: 1 }],
    cfg_scale: 7,
    height: (params.options?.height as number) ?? 1024,
    width: (params.options?.width as number) ?? 1024,
    samples: (params.options?.n as number) ?? 1,
    steps: 30,
  };

  const response = await fetch(
    `${baseURL}/v1/generation/${engineId}/text-to-image`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[stability] API 返回错误 ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    artifacts?: { base64?: string; finishReason?: string }[];
  };

  const artifact = data.artifacts?.[0];
  if (!artifact?.base64) {
    throw new Error('[stability] 响应中无图像数据');
  }

  if (artifact.finishReason && artifact.finishReason !== 'SUCCESS') {
    throw new Error(`[stability] 生成未成功完成: ${artifact.finishReason}`);
  }

  return {
    url: `data:image/png;base64,${artifact.base64}`,
    provider: 'stability',
    cost: 1,
    metadata: {
      prompt: params.prompt,
      generatedAt: new Date().toISOString(),
      width: (params.options?.width as number) ?? 1024,
      height: (params.options?.height as number) ?? 1024,
    },
  };
}

async function handleZhipu(config: ProviderConfig, params: GenerateParams): Promise<Record<string, unknown>> {
  const baseURL = config.baseURL ?? 'https://open.bigmodel.cn/api/paas/v4';
  const model = (params.options?.model as string) ?? config.model ?? 'cogview-3';

  const body = {
    model,
    prompt: params.prompt,
    size: (params.options?.size as string) ?? '1024x1024',
  };

  const response = await fetch(
    `${baseURL}/images/generations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[zhipu] API 返回错误 ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { data?: { url?: string }[] };
  const imageUrl = data.data?.[0]?.url;

  if (!imageUrl) {
    throw new Error('[zhipu] 响应中无图像 URL');
  }

  return {
    url: imageUrl,
    provider: 'zhipu',
    cost: 1,
    metadata: {
      prompt: params.prompt,
      generatedAt: new Date().toISOString(),
      width: 1024,
      height: 1024,
    },
  };
}

async function handleAliyun(config: ProviderConfig, params: GenerateParams): Promise<Record<string, unknown>> {
  const model = (params.options?.model as string) ?? config.model ?? 'qwen-image-2.0-pro';

  const body: Record<string, unknown> = {
    model,
    input: {
      messages: [{ role: 'user', content: [{ text: params.prompt }] }],
    },
    parameters: {
      n: (params.options?.n as number) ?? 1,
      size: (params.options?.size as string) ?? '1920*1080',
      watermark: true,
    },
  };

  if (params.options?.negativePrompt) {
    (body.parameters as Record<string, unknown>).negative_prompt = params.options.negativePrompt;
  }

  const baseURL = config.baseURL ?? 'https://dashscope.aliyuncs.com';
  const res = await fetch(
    `${baseURL}/api/v1/services/aigc/multimodal-generation/generation`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`[aliyun] API 返回错误 ${res.status}: ${errorText}`);
  }

  const data = (await res.json()) as {
    output?: {
      choices?: {
        message?: {
          content?: Array<{ image?: string } | string>;
        };
      }[];
    };
    message?: string;
  };

  const contents = data.output?.choices?.[0]?.message?.content;
  if (!contents || contents.length === 0) {
    throw new Error(`[aliyun] 响应中无图像数据: ${data.message ?? '未知错误'}`);
  }

  const firstContent = contents[0];
  const imageUrl = typeof firstContent === 'string' ? firstContent : firstContent?.image;

  if (!imageUrl) {
    throw new Error('[aliyun] 响应中无图像 URL');
  }

  return {
    url: imageUrl,
    provider: 'aliyun',
    model,
    cost: 1,
    metadata: {
      prompt: params.prompt,
      generatedAt: new Date().toISOString(),
      width: 1920,
      height: 1080,
      model,
    },
  };
}

const GENERATE_HANDLERS: Record<string, (config: ProviderConfig, params: GenerateParams) => Promise<Record<string, unknown>>> = {
  mock: handleMock,
  openai: handleOpenAI,
  stability: handleStability,
  zhipu: handleZhipu,
  aliyun: handleAliyun,
};

async function handleGenerate(params: GenerateParams): Promise<Record<string, unknown>> {
  const providerId = params.providerId ?? 'openai';

  // Mock 无需配置文件
  if (providerId === 'mock') {
    const handler = GENERATE_HANDLERS[providerId];
    return await handler!({} as ProviderConfig, params);
  }

  const config = loadConfig();
  if (!config) {
    throw new Error('尚未配置 API Key，请前往「API 配置」页面添加模型服务密钥');
  }

  const providerConfig = config.providers[providerId];

  if (!providerConfig?.apiKey) {
    throw new Error(`「${providerId}」尚未配置 API Key，请前往「API 配置」页面添加`);
  }

  const modelId = (params.options?.model as string) ?? undefined;

  const check = modelId
    ? quotaService.canGenerate(providerId, modelId)
    : quotaService.canGenerate(providerId);
  if (!check.allowed) {
    throw new Error(check.reason ?? `[${providerId}] 额度已用尽`);
  }

  const handler = GENERATE_HANDLERS[providerId];
  if (!handler) {
    throw new Error(`模型服务 "${providerId}" 暂未支持`);
  }

  const MAX_VALIDATION_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
    try {
      const result = await handler(providerConfig, params);
      const validation = await validateImageResult(result);
      if (validation.valid) {
        quotaService.incrementQuota(providerId, modelId);
        return result;
      }
      console.warn(
        `[ImageValidator] 校验失败 (attempt ${attempt + 1}/${MAX_VALIDATION_RETRIES + 1}): ${validation.reason}`,
      );
      lastError = new Error(`图像质量校验失败: ${validation.reason}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error('图像生成失败');
}

export const imageIpc = {
  handleGenerate,
  getProviders,
  getQuota: (providerId: string): QuotaInfo => quotaService.getQuota(providerId),
};

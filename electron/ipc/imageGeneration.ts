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
  const configPath = path.join(__dirname, '..', '..', 'config', 'local.json');
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

  if (config?.providers.openai?.apiKey) {
    providers.push({
      id: 'openai',
      name: 'GPT-image-2',
      priority: 1,
      available: true,
    });
  }

  // 其他 Provider 按需添加（对应 API Key 存在时标记为可用）
  if (config?.providers.stability?.apiKey) {
    providers.push({
      id: 'stability',
      name: 'Stability AI',
      priority: 2,
      available: true,
    });
  }

  if (config?.providers.zhipu?.apiKey) {
    providers.push({
      id: 'zhipu',
      name: '智谱 CogView',
      priority: 3,
      available: true,
    });
  }

  if (config?.providers.aliyun?.apiKey) {
    providers.push({
      id: 'aliyun',
      name: '阿里云通义万象',
      priority: 4,
      available: true,
    });
  }

  return providers;
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
  const engineId = config.engineId ?? 'stable-diffusion-xl-1024-v1-0';

  const body = {
    text_prompts: [{ text: params.prompt, weight: 1 }],
    cfg_scale: 7,
    height: (params.options?.height as number) ?? 1024,
    width: (params.options?.width as number) ?? 1024,
    samples: (params.options?.n as number) ?? 1,
    steps: 30,
  };

  const response = await fetch(
    `https://api.stability.ai/v1/generation/${engineId}/text-to-image`,
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
  const model = config.model ?? 'cogview-3';

  const body = {
    model,
    prompt: params.prompt,
    size: (params.options?.size as string) ?? '1024x1024',
  };

  const response = await fetch(
    'https://open.bigmodel.cn/api/paas/v4/images/generations',
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
  const model = config.model ?? 'wanx2.0-t2i-turbo';

  const submitBody = {
    model,
    input: { prompt: params.prompt },
    parameters: {
      size: (params.options?.size as string) ?? '1024*1024',
      n: (params.options?.n as number) ?? 1,
    },
  };

  const submitRes = await fetch(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify(submitBody),
    },
  );

  if (!submitRes.ok) {
    const errorText = await submitRes.text();
    throw new Error(`[aliyun] 提交任务失败 ${submitRes.status}: ${errorText}`);
  }

  const submitData = (await submitRes.json()) as {
    output?: { task_id?: string; task_status?: string };
    message?: string;
  };

  const taskId = submitData.output?.task_id;
  if (!taskId) {
    throw new Error(`[aliyun] 未获取到任务 ID: ${submitData.message ?? '未知错误'}`);
  }

  // 轮询任务结果
  const maxAttempts = 30;
  const interval = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, interval));

    const res = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      { headers: { Authorization: `Bearer ${config.apiKey}` } },
    );

    if (!res.ok) continue;

    const data = (await res.json()) as {
      output?: { task_status?: string; results?: { url?: string }[] };
    };

    const status = data.output?.task_status;

    if (status === 'SUCCEEDED') {
      const imageUrl = data.output?.results?.[0]?.url;
      if (!imageUrl) throw new Error('[aliyun] 任务完成但无图像 URL');
      return {
        url: imageUrl,
        provider: 'aliyun',
        cost: 1,
        metadata: {
          prompt: params.prompt,
          generatedAt: new Date().toISOString(),
          width: 1024,
          height: 1024,
        },
      };
    }

    if (status === 'FAILED') {
      throw new Error('[aliyun] 任务执行失败');
    }
  }

  throw new Error(`[aliyun] 任务超时，未在 60s 内完成`);
}

const GENERATE_HANDLERS: Record<string, (config: ProviderConfig, params: GenerateParams) => Promise<Record<string, unknown>>> = {
  openai: handleOpenAI,
  stability: handleStability,
  zhipu: handleZhipu,
  aliyun: handleAliyun,
};

async function handleGenerate(params: GenerateParams): Promise<Record<string, unknown>> {
  const config = loadConfig();
  if (!config) {
    throw new Error('未找到配置文件 config/local.json');
  }

  const providerId = params.providerId ?? 'openai';
  const providerConfig = config.providers[providerId];

  if (!providerConfig?.apiKey) {
    throw new Error(`Provider "${providerId}" 未配置 API Key`);
  }

  const check = quotaService.canGenerate(providerId);
  if (!check.allowed) {
    throw new Error(check.reason ?? `[${providerId}] 额度已用尽`);
  }

  const handler = GENERATE_HANDLERS[providerId];
  if (!handler) {
    throw new Error(`Provider "${providerId}" 暂未支持`);
  }

  const MAX_VALIDATION_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
    try {
      const result = await handler(providerConfig, params);
      const validation = await validateImageResult(result);
      if (validation.valid) {
        quotaService.incrementQuota(providerId);
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

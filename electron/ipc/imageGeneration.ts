import * as fs from 'fs';
import * as path from 'path';

interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

interface Config {
  providers: Record<string, ProviderConfig>;
}

interface GenerateParams {
  prompt: string;
  providerId?: string;
  options?: Record<string, unknown>;
}

interface QuotaInfo {
  used: number;
  total: number;
  resetAt?: string;
  unit: 'count' | 'credit';
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

// 简单的内存配额追踪
const quotaTracker = new Map<string, { used: number; date: string }>();

function getQuota(providerId: string, limit: number): QuotaInfo {
  const today = new Date().toISOString().slice(0, 10);
  const entry = quotaTracker.get(providerId);
  const used = entry?.date === today ? entry.used : 0;
  const resetAt = new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString();

  return { used, total: limit, resetAt, unit: 'count' };
}

function incrementQuota(providerId: string): void {
  const today = new Date().toISOString().slice(0, 10);
  const entry = quotaTracker.get(providerId);

  if (entry?.date === today) {
    entry.used += 1;
  } else {
    quotaTracker.set(providerId, { used: 1, date: today });
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

// 核心：图像生成（仅实现 OpenAI，其他 Provider 可扩展）
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

  // 目前仅实现 OpenAI 调用，其他 Provider 留空
  if (providerId === 'openai') {
    const baseURL = providerConfig.baseURL ?? 'https://api.openai.com/v1';
    const model = providerConfig.model ?? 'gpt-image-2';
    const quota = getQuota('openai', 5);

    if (quota.used >= quota.total) {
      throw new Error(`[${providerId}] 今日免费额度已用尽 (${quota.used}/${quota.total})`);
    }

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
        Authorization: `Bearer ${providerConfig.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`[${providerId}] API 返回错误 ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as { data?: { url?: string }[] };
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error(`[${providerId}] 响应中无图像 URL`);
    }

    incrementQuota('openai');

    return {
      url: imageUrl,
      provider: providerId,
      cost: 0,
      metadata: {
        prompt: params.prompt,
        generatedAt: new Date().toISOString(),
        width: 1024,
        height: 1024,
      },
    };
  }

  throw new Error(`Provider "${providerId}" 暂未支持`);
}

export const imageIpc = {
  handleGenerate,
  getProviders,
  getQuota: (providerId: string) => getQuota(providerId, 5),
};

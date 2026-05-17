import { ipcMain, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

interface ProviderModelConfig {
  description?: string;
  remaining: number;
  total: number;
}

interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  models?: Record<string, ProviderModelConfig>;
}

interface AppConfig {
  providers: Record<string, ProviderConfig>;
  providerOrder?: string[];
}

interface ModelMeta {
  id: string;
  name?: string;
  description?: string;
}

const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  stability: 'https://api.stability.ai',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  aliyun: 'https://dashscope.aliyuncs.com',
};

/**
 * 各 Provider 的静态 fallback 列表（API 不可达 / 响应为空时使用）
 */
const FALLBACK_MODELS: Record<string, ModelMeta[]> = {
  mock: [
    { id: 'mock-default', name: 'Mock Default', description: '默认占位模型' },
    { id: 'mock-fast', name: 'Mock Fast', description: '快速模式（无差异）' },
  ],
  zhipu: [
    { id: 'cogview-3', name: 'CogView-3', description: '通用图像生成（默认）' },
    { id: 'cogview-3-plus', name: 'CogView-3 Plus', description: '更高质量' },
  ],
  aliyun: [
    { id: 'wan2.7-image-pro', name: 'wan2.7-image-pro', description: '文字渲染、品牌色、角色一致性' },
    { id: 'wan2.7-image', name: 'wan2.7-image', description: '生成速度更快，最高 2K' },
    { id: 'wanx2.0-t2i-turbo', name: 'wanx2.0-t2i-turbo', description: '通用图像生成（异步任务）' },
    { id: 'qwen-image-2.0-pro', name: 'qwen-image-2.0-pro', description: '负向提示词、多图变体' },
  ],
};

async function fetchModelsForProvider(
  providerId: string,
  apiKey: string,
  customBaseURL?: string,
): Promise<ModelMeta[]> {
  const baseURL = customBaseURL || DEFAULT_BASE_URLS[providerId];

  if (providerId === 'mock') {
    return FALLBACK_MODELS.mock;
  }

  if (providerId === 'openai') {
    const res = await fetch(`${baseURL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { data?: { id: string }[] };
    return (json.data ?? [])
      .filter((m) => /image|dall-e/i.test(m.id))
      .map((m) => ({ id: m.id, name: m.id }));
  }

  if (providerId === 'stability') {
    const res = await fetch(`${baseURL}/v1/engines/list`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arr = (await res.json()) as Array<{ id: string; name?: string; description?: string }>;
    return (Array.isArray(arr) ? arr : []).map((e) => ({
      id: e.id,
      name: e.name ?? e.id,
      description: e.description,
    }));
  }

  if (providerId === 'zhipu') {
    try {
      const res = await fetch(`${baseURL}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: { id: string }[] };
        const filtered = (json.data ?? [])
          .filter((m) => /cogview|image/i.test(m.id))
          .map((m) => ({ id: m.id, name: m.id }));
        if (filtered.length > 0) return filtered;
      }
    } catch {
      // fallback below
    }
    return FALLBACK_MODELS.zhipu;
  }

  if (providerId === 'aliyun') {
    try {
      const res = await fetch(`${baseURL}/compatible-mode/v1/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: { id: string }[] };
        const filtered = (json.data ?? [])
          .filter((m) => /^(wan|wanx|qwen-image|z-image)/i.test(m.id))
          .map((m) => ({ id: m.id, name: m.id }));
        if (filtered.length > 0) return filtered;
      }
    } catch {
      // fallback below
    }
    return FALLBACK_MODELS.aliyun;
  }

  throw new Error(`不支持的模型服务: ${providerId}`);
}

function getConfigPath(): string {
  // 生产环境：存到 userData 目录，确保可读写
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'config.json');
  }
  // 开发环境：从项目 config/ 目录读取
  return path.join(__dirname, '..', '..', 'config', 'local.json');
}

function maskKey(key: string): string {
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function registerConfigIpc(): void {
  ipcMain.handle('config:get', async () => {
    try {
      const configPath = getConfigPath();
      if (!fs.existsSync(configPath)) {
        return { status: 'ok', data: { providers: {} } };
      }
      const raw = fs.readFileSync(configPath, 'utf-8');
      const config: AppConfig = JSON.parse(raw);

      // 脱敏 API Key（baseURL 不脱敏，不是敏感信息）
      const masked: Record<string, unknown> = {};
      for (const [pid, pc] of Object.entries(config.providers)) {
        masked[pid] = {
          hasKey: !!pc.apiKey,
          maskedKey: pc.apiKey ? maskKey(pc.apiKey) : null,
          baseURL: pc.baseURL,
          models: pc.models ?? {},
        };
      }

      return { status: 'ok', data: { providers: masked, providerOrder: config.providerOrder ?? [] } };
    } catch (err) {
      const message = err instanceof Error ? err.message : '读取配置失败';
      return { status: 'error', message };
    }
  });

  ipcMain.handle('config:set', async (_event, params: {
    providerId: string;
    apiKey?: string;
    baseURL?: string;
    models?: Record<string, ProviderModelConfig>;
  }) => {
    try {
      const configPath = getConfigPath();
      let config: AppConfig = { providers: {} };

      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }

      if (!config.providers[params.providerId]) {
        config.providers[params.providerId] = {};
      }

      if (params.apiKey !== undefined) {
        config.providers[params.providerId].apiKey = params.apiKey;
      }

      if (params.baseURL !== undefined) {
        // D-2.4 选项 B：空字符串视为"删除字段"，恢复默认 baseURL
        if (params.baseURL === '') {
          delete config.providers[params.providerId].baseURL;
        } else {
          config.providers[params.providerId].baseURL = params.baseURL;
        }
      }

      if (params.models !== undefined) {
        config.providers[params.providerId].models = params.models;
      }

      const dir = path.dirname(configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

      return { status: 'ok' };
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存配置失败';
      return { status: 'error', message };
    }
  });

  ipcMain.handle('config:test', async (_event, params: {
    providerId: string;
    apiKey: string;
    baseURL?: string;
  }) => {
    const start = Date.now();
    const buildResult = (
      ok: boolean,
      message: string,
      extra?: { errorCode?: string; latencyMs?: number },
    ) => ({
      status: ok ? 'ok' : 'error',
      message,
      latencyMs: extra?.latencyMs ?? (Date.now() - start),
      errorCode: extra?.errorCode,
    });

    try {
      if (params.providerId === 'aliyun') {
        const baseURL = params.baseURL || 'https://dashscope.aliyuncs.com';
        const res = await fetch(
          `${baseURL}/api/v1/services/aigc/multimodal-generation/generation`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${params.apiKey}`,
            },
            body: JSON.stringify({
              model: 'qwen-image-2.0',
              input: { messages: [{ role: 'user', content: [{ text: 'test' }] }] },
              parameters: { n: 1, size: '1024*1024' },
            }),
          },
        );
        if (res.ok) return buildResult(true, '连接成功');
        const errText = await res.text();
        return buildResult(false, `API 返回 ${res.status}: ${errText.slice(0, 200)}`, {
          errorCode: `HTTP_${res.status}`,
        });
      }

      if (params.providerId === 'openai') {
        const baseURL = params.baseURL || 'https://api.openai.com/v1';
        const res = await fetch(`${baseURL}/models`, {
          headers: { Authorization: `Bearer ${params.apiKey}` },
        });
        if (res.ok) return buildResult(true, '连接成功');
        return buildResult(false, `API 返回 ${res.status}`, {
          errorCode: `HTTP_${res.status}`,
        });
      }

      if (params.providerId === 'stability') {
        const baseURL = params.baseURL || 'https://api.stability.ai';
        const res = await fetch(`${baseURL}/v1/engines/list`, {
          headers: { Authorization: `Bearer ${params.apiKey}` },
        });
        if (res.ok) return buildResult(true, '连接成功');
        return buildResult(false, `API 返回 ${res.status}`, {
          errorCode: `HTTP_${res.status}`,
        });
      }

      if (params.providerId === 'zhipu') {
        const baseURL = params.baseURL || 'https://open.bigmodel.cn/api/paas/v4';
        const res = await fetch(`${baseURL}/models`, {
          headers: { Authorization: `Bearer ${params.apiKey}` },
        });
        if (res.ok) return buildResult(true, '连接成功');
        return buildResult(false, `API 返回 ${res.status}`, {
          errorCode: `HTTP_${res.status}`,
        });
      }

      if (params.providerId === 'mock') {
        // Mock 始终成功（开发环境豁免）
        return buildResult(true, 'Mock 模型服务无需测试');
      }

      return buildResult(false, `不支持的模型服务: ${params.providerId}`, {
        errorCode: 'UNKNOWN_PROVIDER',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '测试连接失败';
      // 区分网络异常 vs 其它
      const errorCode = /timeout/i.test(message)
        ? 'TIMEOUT'
        : /fetch|network|enot/i.test(message)
        ? 'NETWORK'
        : 'UNKNOWN';
      return buildResult(false, message, { errorCode });
    }
  });

  /**
   * 拉取指定 Provider 的可用模型列表。
   * 主进程直接发请求（不经 Provider 类，避免引入 renderer 端依赖）。
   * 失败时各 Provider 提供静态 fallback。
   */
  ipcMain.handle('config:list-models', async (_event, params: { providerId: string }) => {
    try {
      const configPath = getConfigPath();
      let config: AppConfig = { providers: {} };
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
      const pc = config.providers[params.providerId];
      const apiKey = pc?.apiKey ?? '';
      const baseURL = pc?.baseURL;

      if (!apiKey && params.providerId !== 'mock') {
        return { status: 'error', message: `[${params.providerId}] 未配置 API Key` };
      }

      const models = await fetchModelsForProvider(params.providerId, apiKey, baseURL);
      return { status: 'ok', data: models };
    } catch (err) {
      const message = err instanceof Error ? err.message : '拉取模型列表失败';
      return { status: 'error', message };
    }
  });

  ipcMain.handle('config:set-order', async (_event, order: string[]) => {
    try {
      const configPath = getConfigPath();
      let config: AppConfig = { providers: {} };

      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }

      config.providerOrder = order;

      const dir = path.dirname(configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

      return { status: 'ok' };
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存排序失败';
      return { status: 'error', message };
    }
  });
}

export { registerConfigIpc };
export type { ProviderModelConfig };

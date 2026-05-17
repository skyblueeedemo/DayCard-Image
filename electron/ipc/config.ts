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
  models?: Record<string, ProviderModelConfig>;
}

interface AppConfig {
  providers: Record<string, ProviderConfig>;
  providerOrder?: string[];
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

      // 脱敏 API Key
      const masked: Record<string, unknown> = {};
      for (const [pid, pc] of Object.entries(config.providers)) {
        masked[pid] = {
          hasKey: !!pc.apiKey,
          maskedKey: pc.apiKey ? maskKey(pc.apiKey) : null,
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

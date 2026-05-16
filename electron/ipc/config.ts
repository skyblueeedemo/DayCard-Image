import { ipcMain } from 'electron';
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
}

function getConfigPath(): string {
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

      return { status: 'ok', data: { providers: masked } };
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
  }) => {
    try {
      if (params.providerId === 'aliyun') {
        const res = await fetch(
          'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
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
        if (res.ok) {
          return { status: 'ok', message: '连接成功' };
        }
        const errText = await res.text();
        return { status: 'error', message: `API 返回 ${res.status}: ${errText.slice(0, 200)}` };
      }

      if (params.providerId === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${params.apiKey}` },
        });
        if (res.ok) return { status: 'ok', message: '连接成功' };
        return { status: 'error', message: `API 返回 ${res.status}` };
      }

      return { status: 'error', message: `不支持的 Provider: ${params.providerId}` };
    } catch (err) {
      const message = err instanceof Error ? err.message : '测试连接失败';
      return { status: 'error', message };
    }
  });
}

export { registerConfigIpc };
export type { ProviderModelConfig };

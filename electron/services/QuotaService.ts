import { app } from 'electron';
import { readStore, writeStore } from '../storage';
import * as fs from 'fs';
import * as path from 'path';

interface QuotaRecord {
  providerId: string;
  modelId?: string;
  date: string;
  used: number;
  total: number;
}

interface QuotaStoreData {
  records: QuotaRecord[];
}

interface QuotaInfo {
  used: number;
  total: number;
  resetAt: string;
  unit: 'count' | 'credit';
}

interface ModelConfig {
  description?: string;
  remaining: number;
  total: number;
}

const QUOTA_LIMITS: Record<string, number> = {
  openai: 5,
  stability: Infinity,
  zhipu: Infinity,
  aliyun: Infinity,
};

const STORE_NAME = 'quota';

function getConfigPath(): string {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'config.json');
  }
  return path.join(__dirname, '..', '..', 'config', 'local.json');
}

function loadModelConfig(providerId: string): Record<string, ModelConfig> {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf-8');
    const config = JSON.parse(raw);
    return config?.providers?.[providerId]?.models ?? {};
  } catch {
    return {};
  }
}

function saveModelRemaining(providerId: string, modelId: string, remaining: number): void {
  try {
    const configPath = getConfigPath();
    const raw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw);
    if (config?.providers?.[providerId]?.models?.[modelId]) {
      config.providers[providerId].models[modelId].remaining = remaining;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    }
  } catch {
    // 静默失败
  }
}

class QuotaService {
  private today(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private resetTime(): string {
    return new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString();
  }

  getModelQuota(providerId: string, modelId: string): QuotaInfo {
    const models = loadModelConfig(providerId);
    const model = models[modelId];
    if (model) {
      const used = model.total - model.remaining;
      return {
        used,
        total: model.total,
        resetAt: this.resetTime(),
        unit: 'count',
      };
    }
    return { used: 0, total: Infinity, resetAt: this.resetTime(), unit: 'credit' };
  }

  getQuota(providerId: string): QuotaInfo {
    const limit = QUOTA_LIMITS[providerId] ?? Infinity;
    const todayStr = this.today();
    const data = readStore<QuotaStoreData>(STORE_NAME, { records: [] });
    const todayRecord = data.records.find(
      (r) => r.providerId === providerId && !r.modelId && r.date === todayStr,
    );
    return {
      used: todayRecord?.used ?? 0,
      total: limit,
      resetAt: this.resetTime(),
      unit: limit === Infinity ? 'credit' : 'count',
    };
  }

  incrementQuota(providerId: string, modelId?: string): void {
    const models = loadModelConfig(providerId);
    const model = modelId ? models[modelId] : undefined;
    const total = model?.total ?? QUOTA_LIMITS[providerId] ?? Infinity;
    const todayStr = this.today();
    const data = readStore<QuotaStoreData>(STORE_NAME, { records: [] });

    const idx = data.records.findIndex((r) => {
      const keyMatch = modelId
        ? r.providerId === providerId && r.modelId === modelId
        : r.providerId === providerId && !r.modelId;
      return keyMatch && r.date === todayStr;
    });

    if (idx >= 0) {
      data.records[idx] = { ...data.records[idx], used: data.records[idx].used + 1 };
    } else {
      data.records.push({ providerId, modelId, date: todayStr, used: 1, total });
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    data.records = data.records.filter((r: QuotaRecord) => r.date >= cutoffStr);

    writeStore(STORE_NAME, data);

    // 同步回 config/local.json 的 remaining
    if (modelId && model) {
      const newRemaining = Math.max(0, model.remaining - 1);
      saveModelRemaining(providerId, modelId, newRemaining);
    }
  }

  canGenerate(providerId: string, modelId?: string): { allowed: boolean; reason?: string } {
    const quota = modelId
      ? this.getModelQuota(providerId, modelId)
      : this.getQuota(providerId);
    if (quota.total !== Infinity && quota.used >= quota.total) {
      const resetDate = new Date(quota.resetAt);
      const hours = resetDate.getHours();
      const mins = String(resetDate.getMinutes()).padStart(2, '0');
      const label = modelId ? `${providerId}/${modelId}` : providerId;
      return {
        allowed: false,
        reason: `[${label}] 今日额度已用尽 (${quota.used}/${quota.total})，明日 ${hours}:${mins} 重置`,
      };
    }
    return { allowed: true };
  }

  getHistory(providerId: string, days = 30): QuotaRecord[] {
    const data = readStore<QuotaStoreData>(STORE_NAME, { records: [] });
    return data.records
      .filter((r: QuotaRecord) => r.providerId === providerId)
      .sort((a: QuotaRecord, b: QuotaRecord) => b.date.localeCompare(a.date))
      .slice(0, days);
  }

  getAllQuotas(): Record<string, QuotaInfo> {
    const result: Record<string, QuotaInfo> = {};
    for (const id of Object.keys(QUOTA_LIMITS)) {
      result[id] = this.getQuota(id);
    }
    return result;
  }
}

export const quotaService = new QuotaService();
export type { QuotaInfo, QuotaRecord };

import { readStore, writeStore } from '../storage';

interface QuotaRecord {
  providerId: string;
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

const QUOTA_LIMITS: Record<string, number> = {
  openai: 5,
  stability: Infinity,
  zhipu: Infinity,
  aliyun: Infinity,
};

const STORE_NAME = 'quota';

class QuotaService {
  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private resetTime(): string {
    return new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString();
  }

  getQuota(providerId: string): QuotaInfo {
    const limit = QUOTA_LIMITS[providerId] ?? Infinity;
    const todayStr = this.today();
    const data = readStore<QuotaStoreData>(STORE_NAME, { records: [] });
    const todayRecord = data.records.find(
      (r: QuotaRecord) => r.providerId === providerId && r.date === todayStr,
    );
    return {
      used: todayRecord?.used ?? 0,
      total: limit,
      resetAt: this.resetTime(),
      unit: limit === Infinity ? 'credit' : 'count',
    };
  }

  incrementQuota(providerId: string): void {
    const limit = QUOTA_LIMITS[providerId] ?? Infinity;
    const todayStr = this.today();
    const data = readStore<QuotaStoreData>(STORE_NAME, { records: [] });
    const idx = data.records.findIndex(
      (r: QuotaRecord) => r.providerId === providerId && r.date === todayStr,
    );

    if (idx >= 0) {
      data.records[idx] = { ...data.records[idx], used: data.records[idx].used + 1 };
    } else {
      data.records.push({ providerId, date: todayStr, used: 1, total: limit });
    }

    // 保留最近 90 天
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    data.records = data.records.filter((r: QuotaRecord) => r.date >= cutoffStr);

    writeStore(STORE_NAME, data);
  }

  canGenerate(providerId: string): { allowed: boolean; reason?: string } {
    const quota = this.getQuota(providerId);
    if (quota.total !== Infinity && quota.used >= quota.total) {
      const resetDate = new Date(quota.resetAt);
      const hours = resetDate.getHours();
      const mins = String(resetDate.getMinutes()).padStart(2, '0');
      return {
        allowed: false,
        reason: `今日额度已用尽 (${quota.used}/${quota.total})，明日 ${hours}:${mins} 重置`,
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

  getAllQuotas(): QuotaInfo[] {
    const providerIds = Object.keys(QUOTA_LIMITS);
    return providerIds.map((id) => this.getQuota(id));
  }
}

export const quotaService = new QuotaService();
export type { QuotaInfo, QuotaRecord };

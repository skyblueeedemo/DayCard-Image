// ============================================================
// IImageProvider — 所有 Provider 必须实现的统一接口
// ============================================================

/** 图像生成结果 */
export interface ImageResult {
  url: string;
  provider: string;
  cost: number;
  metadata: {
    prompt: string;
    generatedAt: string;
    width: number;
    height: number;
  };
}

/** 生成参数 */
export interface GenerateOptions {
  width?: number;
  height?: number;
  style?: string;
  quality?: 'standard' | 'hd';
  n?: number;
}

/** 配额信息 */
export interface QuotaInfo {
  used: number;
  total: number;
  resetAt?: string;
  unit: 'count' | 'credit';
}

/** Provider 接口 */
export interface IImageProvider {
  readonly id: string;
  readonly name: string;
  readonly priority: number;

  generate(prompt: string, options?: GenerateOptions): Promise<ImageResult>;
  isAvailable(): Promise<boolean>;
  getQuota(): Promise<QuotaInfo>;
}

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
  /** 模型 ID（覆盖 Provider 默认模型） */
  model?: string;
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

/** 模型元数据（listModels 返回） */
export interface ModelMeta {
  /** 模型 ID（API 调用使用） */
  id: string;
  /** 用户可见名称（可选；不存在时 UI 用 id） */
  name?: string;
  /** 用户可见说明（可选） */
  description?: string;
  /** Provider 原始响应（调试用） */
  raw?: unknown;
}

/** Provider 接口 */
export interface IImageProvider {
  readonly id: string;
  readonly name: string;
  readonly priority: number;

  generate(prompt: string, options?: GenerateOptions): Promise<ImageResult>;
  isAvailable(): Promise<boolean>;
  getQuota(): Promise<QuotaInfo>;
  /**
   * 列出当前 Provider 可用的模型。可选实现：
   * - 返回空数组表示"暂无模型信息"
   * - 抛出错误表示"调用失败"，调用方需捕获并 fallback
   */
  listModels?(): Promise<ModelMeta[]>;
}

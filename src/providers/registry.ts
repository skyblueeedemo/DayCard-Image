/**
 * Provider 注册表 — 元数据集中管理
 *
 * 设计目标：
 * 1. 把 PROVIDER_LABELS / DEFAULT_MODELS / 优先级等分散硬编码合并到一处
 * 2. 新增 Provider 只需在此追加一条记录
 * 3. UI（ApiConfigPage / ProviderSelector / ProviderList）和 IPC 层均从此读取
 *
 * 注意：
 * - 不包含 apiKey / baseURL 等运行时凭证（仍由 config/local.json 或 userData/config.json 管理）
 * - 不替代 IImageProvider 类（后者负责实际 API 调用）
 */

export interface ModelMeta {
  /** 模型 ID（API 调用使用） */
  id: string;
  /** 用户可见说明（UI 显示） */
  description: string;
  /** 默认每日配额（用户首次使用时初始化） */
  defaultQuota: number;
}

export interface ProviderMeta {
  /** Provider 唯一标识，对应 IImageProvider.id */
  id: string;
  /** UI 显示名称（用户友好版） */
  label: string;
  /** 内部技术名称（与 IImageProvider.name 对齐） */
  technicalName: string;
  /** 调度优先级（数值越小越高） */
  priority: number;
  /** 默认模型列表（"导入默认模型" 按钮用） */
  defaultModels: ModelMeta[];
  /** 是否仅在开发模式下可见（Mock） */
  devOnly?: boolean;
  /** 官方文档链接 */
  docsURL?: string;
  /** 默认 Base URL（暂未生效，预留给阶段二 2.2 自定义 Base URL） */
  defaultBaseURL?: string;
}

/**
 * Provider 注册表 — 单一事实来源
 *
 * 顺序：按 priority 升序排列（用户可在 API 配置页拖拽排序覆盖）
 */
export const PROVIDER_REGISTRY: ProviderMeta[] = [
  {
    id: 'mock',
    label: 'Mock 模型服务 (Dev)',
    technicalName: 'Mock 模型服务 (Dev Only)',
    priority: 0,
    defaultModels: [],
    devOnly: true,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    technicalName: 'GPT-image-2',
    priority: 1,
    defaultModels: [],
    docsURL: 'https://platform.openai.com/docs',
    defaultBaseURL: 'https://api.openai.com/v1',
  },
  {
    id: 'stability',
    label: 'Stability AI',
    technicalName: 'Stability AI',
    priority: 2,
    defaultModels: [],
    docsURL: 'https://platform.stability.ai/docs',
    defaultBaseURL: 'https://api.stability.ai',
  },
  {
    id: 'zhipu',
    label: '智谱 CogView',
    technicalName: '智谱 CogView',
    priority: 3,
    defaultModels: [],
    docsURL: 'https://open.bigmodel.cn/dev/api',
    defaultBaseURL: 'https://open.bigmodel.cn/api/paas/v4',
  },
  {
    id: 'aliyun',
    label: 'DashScope (阿里云)',
    technicalName: '阿里云通义万象',
    priority: 4,
    docsURL: 'https://help.aliyun.com/zh/dashscope/',
    defaultBaseURL: 'https://dashscope.aliyuncs.com',
    defaultModels: [
      { id: 'wan2.7-image-pro', description: '文字渲染、品牌色、角色一致性多图生成、多图编辑', defaultQuota: 50 },
      { id: 'wan2.7-image', description: '生成速度更快，最高2K', defaultQuota: 50 },
      { id: 'z-image-turbo', description: '快速生成、低成本、写实人像', defaultQuota: 100 },
      { id: 'qwen-image-2.0', description: '', defaultQuota: 100 },
      { id: 'qwen-image-2.0-2026-03-03', description: '', defaultQuota: 100 },
      { id: 'qwen-image-2.0-pro-2026-03-03', description: '负向提示词、最多6张图片变体', defaultQuota: 100 },
      { id: 'qwen-image-2.0-pro', description: '负向提示词、最多6张图片变体', defaultQuota: 100 },
      { id: 'qwen-image-2.0-pro-2026-04-22', description: '负向提示词、最多6张图片变体', defaultQuota: 100 },
    ],
  },
];

/**
 * 根据 id 查找 Provider 元数据
 */
export function getProviderMeta(id: string): ProviderMeta | undefined {
  return PROVIDER_REGISTRY.find((p) => p.id === id);
}

/**
 * 取生产环境可见的 Provider 列表（过滤 devOnly）
 */
export function getVisibleProviders(isDev: boolean): ProviderMeta[] {
  return PROVIDER_REGISTRY.filter((p) => isDev || !p.devOnly);
}

/**
 * 兼容旧 PROVIDER_LABELS 形态：返回 { id: label } 字典
 */
export function getProviderLabels(isDev: boolean): Record<string, string> {
  const result: Record<string, string> = {};
  for (const p of getVisibleProviders(isDev)) {
    result[p.id] = p.label;
  }
  return result;
}

/**
 * 兼容旧 DEFAULT_MODELS 形态：返回 { id: { modelId: { description, remaining, total } } }
 */
export function getDefaultModels(): Record<string, Record<string, { description: string; remaining: number; total: number }>> {
  const result: Record<string, Record<string, { description: string; remaining: number; total: number }>> = {};
  for (const p of PROVIDER_REGISTRY) {
    if (p.defaultModels.length === 0) continue;
    const models: Record<string, { description: string; remaining: number; total: number }> = {};
    for (const m of p.defaultModels) {
      models[m.id] = {
        description: m.description,
        remaining: m.defaultQuota,
        total: m.defaultQuota,
      };
    }
    result[p.id] = models;
  }
  return result;
}

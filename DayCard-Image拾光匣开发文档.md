# DayCard-Image（拾光匣）技术开发文档

**版本**: v1.0.0  
**更新时间**: 2026-05-15  
**状态**: MVP

------

## 目录

1. [项目概述](https://claude.ai/chat/b8cc1aae-dffe-4506-84bc-8483f1531b69#%E4%B8%80%E9%A1%B9%E7%9B%AE%E6%A6%82%E8%BF%B0)
2. [技术栈](https://claude.ai/chat/b8cc1aae-dffe-4506-84bc-8483f1531b69#%E4%BA%8C%E6%8A%80%E6%9C%AF%E6%A0%88)
3. [系统架构](https://claude.ai/chat/b8cc1aae-dffe-4506-84bc-8483f1531b69#%E4%B8%89%E7%B3%BB%E7%BB%9F%E6%9E%B6%E6%9E%84)
4. [Provider 接入规范](https://claude.ai/chat/b8cc1aae-dffe-4506-84bc-8483f1531b69#%E5%9B%9Bprovider-%E6%8E%A5%E5%85%A5%E8%A7%84%E8%8C%83)
5. [核心模块设计](https://claude.ai/chat/b8cc1aae-dffe-4506-84bc-8483f1531b69#%E4%BA%94%E6%A0%B8%E5%BF%83%E6%A8%A1%E5%9D%97%E8%AE%BE%E8%AE%A1)
6. [业务流程](https://claude.ai/chat/b8cc1aae-dffe-4506-84bc-8483f1531b69#%E5%85%AD%E4%B8%9A%E5%8A%A1%E6%B5%81%E7%A8%8B)
7. [接口定义](https://claude.ai/chat/b8cc1aae-dffe-4506-84bc-8483f1531b69#%E4%B8%83%E6%8E%A5%E5%8F%A3%E5%AE%9A%E4%B9%89)
8. [错误处理与风险控制](https://claude.ai/chat/b8cc1aae-dffe-4506-84bc-8483f1531b69#%E5%85%AB%E9%94%99%E8%AF%AF%E5%A4%84%E7%90%86%E4%B8%8E%E9%A3%8E%E9%99%A9%E6%8E%A7%E5%88%B6)
9. [扩展指南](https://claude.ai/chat/b8cc1aae-dffe-4506-84bc-8483f1531b69#%E4%B9%9D%E6%89%A9%E5%B1%95%E6%8C%87%E5%8D%97)
10. [Mock Provider（开发测试专用）](#十mock-provider开发测试专用)
11. [附录](https://claude.ai/chat/b8cc1aae-dffe-4506-84bc-8483f1531b69#%E5%8D%81%E9%99%84%E5%BD%95)

------

## 一、项目概述

**DayCard-Image（拾光匣）** 是一款基于 **Electron + React** 构建的跨平台 AI 图像生成桌面应用，通过统一的 Provider Adapter 模式屏蔽各 AI 平台的接口差异，为用户提供一致、稳定的图像生成体验。

### 1.1 设计目标

| 目标            | 描述                                               |
| --------------- | -------------------------------------------------- |
| 多平台统一接入  | 通过统一接口管理多家 AI 图像生成服务               |
| 热切换 Provider | 运行时无感切换图像生成后端                         |
| 桌面级原生体验  | 结合 Electron 提供系统级能力（文件、通知、离线等） |
| 可扩展生态      | 插件化架构，支持快速接入新 Provider                |

### 1.2 核心设计理念

> DayCard-Image 不是一个单一的图像工具，而是**一个可持续演化的 AI 能力接入平台**。
>
> Provider ≠ 功能；Provider = 可替换的基础设施。

用户无需关心底层 API 差异、平台限制或网络环境，系统自动完成调度与降级。

### 1.3 项目目录结构

```
daycard-image/
├── electron/                  # Electron 主进程
│   ├── main.ts
│   ├── preload.ts
│   └── ipc/                   # IPC 通信模块
├── src/
│   ├── components/            # React UI 组件
│   │   ├── DailyCard/
│   │   ├── ProviderSelector/
│   │   ├── QuotaBar/
│   │   └── ImageGrid/
│   ├── providers/             # Provider Adapter 层
│   │   ├── IImageProvider.ts  # 统一接口定义
│   │   ├── ProviderManager.ts # Provider 调度器
│   │   ├── openai/
│   │   ├── stability/
│   │   ├── zhipu/
│   │   └── aliyun/
│   ├── store/                 # 状态管理
│   ├── hooks/                 # 自定义 Hooks
│   └── utils/
├── public/
└── package.json
```

------

## 二、技术栈

### 2.1 技术选型

| 层级            | 技术方案                 | 说明                                |
| --------------- | ------------------------ | ----------------------------------- |
| Desktop Runtime | Electron                 | 跨平台桌面壳，提供 Node.js 系统能力 |
| UI Framework    | React 18                 | 组件化 UI，Hooks 驱动状态           |
| 样式方案        | TailwindCSS              | 原子化 CSS，快速构建                |
| 状态管理        | React Hooks + Context    | 轻量状态，按需引入 Zustand          |
| API 接入        | Provider Adapter Pattern | 统一多平台接口                      |
| 语言            | TypeScript               | 全栈类型安全                        |
| 构建工具        | Vite + electron-builder  | 快速编译与打包                      |

### 2.2 依赖版本要求

| 依赖       | 版本要求  |
| ---------- | --------- |
| Node.js    | >= 18.0.0 |
| Electron   | >= 28.0.0 |
| React      | >= 18.2.0 |
| TypeScript | >= 5.0.0  |

------

## 三、系统架构

### 3.1 分层架构总览

```
┌─────────────────────────────────────────────────┐
│                   UI Layer                       │
│          React + TailwindCSS                     │
│   DailyCard · ProviderSelector · ImageGrid       │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              Application Layer                   │
│        业务逻辑 · 状态管理 · 任务调度              │
│   ProviderManager · QuotaService · RetryQueue    │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           Provider Adapter Layer                 │
│              IImageProvider 接口                  │
│  OpenAI · DALL-E · StabilityAI · CogView · ...  │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│               System Layer                       │
│                  Electron                        │
│     文件系统 · 本地缓存 · 系统通知 · 离线能力      │
└─────────────────────────────────────────────────┘
```

### 3.2 各层职责说明

**UI Layer**

- 负责用户交互与状态反馈
- 组件化设计，状态驱动渲染
- 关键页面：抽卡主页、Provider 管理、配额面板、历史记录

**Application Layer**

- Provider 热切换与调度
- Prompt 模板管理
- 请求队列与重试机制
- 错误恢复与降级策略

**Provider Adapter Layer**（核心）

- 统一 `IImageProvider` 接口，屏蔽各平台差异
- 处理参数映射、鉴权、返回格式归一化
- 统一输出 `ImageResult` 数据结构

**System Layer**

- 借助 Electron 提供文件读写、本地缓存
- 系统级推送通知
- 离线缓存与图像本地持久化

------

## 四、Provider 接入规范

### 4.1 已接入 Provider 一览

| Provider        | 类型     | 计费方式                    | 推荐场景                  | 状态     |
| --------------- | -------- | --------------------------- | ------------------------- | -------- |
| GPT-image-2     | 官方 API | 每日免费额度（5 张） + 付费 | 默认主通道，产品级输出    | ✅ 已接入 |
| DALL·E 3        | 官方 API | 按调用计费                  | 创意卡片、艺术类生成      | ✅ 已接入 |
| Stability AI    | REST API | 低成本按量                  | 大规模生成、实验功能      | ✅ 已接入 |
| 智谱 CogView    | 国内 API | 按量计费                    | 国内合规环境、中文 Prompt | ✅ 已接入 |
| 阿里云通义万象  | 国内 API | 企业 SLA                    | 生产级备用通道            | ✅ 已接入 |
| 自定义 Provider | 插件扩展 | 自定义                      | 本地模型、私有 API        | 🔌 可扩展 |

### 4.2 各 Provider 特性对比

#### GPT-image-2（主 Provider）

- **优先级**：最高，默认主通道
- **质量**：输出质量最稳定，官方 SDK 支持
- **额度策略**：每日免费 5 张，超出后按量付费
- **适用场景**：日卡生成、产品级默认输出

#### DALL·E 3

- **优先级**：次选，创意类场景
- **特点**：创意表达能力强，Prompt 理解优秀
- **计费**：无免费额度，按调用计费
- **适用场景**：艺术风格卡片、高创意内容

#### Stability AI（SD 系列）

- **优先级**：成本敏感或大批量时优先
- **特点**：开放生态，支持私有化部署
- **计费**：成本低，按量
- **适用场景**：批量生成、实验性功能测试

#### 智谱 CogView

- **优先级**：国内环境首选
- **特点**：中文 Prompt 友好，无需代理，合规
- **适用场景**：面向国内用户的生产环境

#### 阿里云通义万象

- **优先级**：国内生产备用
- **特点**：商业级稳定，企业 SLA 保障
- **适用场景**：国内生产环境备用通道

------

## 五、核心模块设计

### 5.1 IImageProvider 接口

所有 Provider 必须实现以下统一接口：

```typescript
interface IImageProvider {
  readonly id: string;              // Provider 唯一标识
  readonly name: string;            // Provider 显示名称
  readonly priority: number;        // 调度优先级（数值越小越高）

  /**
   * 生成图像
   * @param prompt     图像描述
   * @param options    可选生成参数
   * @returns          统一图像结果
   */
  generate(prompt: string, options?: GenerateOptions): Promise<ImageResult>;

  /**
   * 检查当前 Provider 是否可用（额度、网络等）
   */
  isAvailable(): Promise<boolean>;

  /**
   * 获取当前配额状态
   */
  getQuota(): Promise<QuotaInfo>;
}
```

### 5.2 统一数据结构

```typescript
// 图像生成结果
interface ImageResult {
  url: string;                      // 图像访问地址
  provider: string;                 // 来源 Provider ID
  cost: number;                     // 本次消耗费用（归一化，单位：分）
  metadata: {
    prompt: string;                 // 实际使用的 Prompt
    generatedAt: string;            // ISO 8601 时间戳
    width: number;
    height: number;
  };
}

// 生成参数
interface GenerateOptions {
  width?: number;
  height?: number;
  style?: string;
  quality?: 'standard' | 'hd';
  n?: number;                       // 生成数量，默认 1
}

// 配额信息
interface QuotaInfo {
  used: number;
  total: number;
  resetAt?: string;                 // 配额重置时间
  unit: 'count' | 'credit';
}
```

### 5.3 ProviderManager 调度逻辑

```typescript
class ProviderManager {
  private providers: IImageProvider[] = [];

  /**
   * 按优先级尝试各 Provider，失败时自动降级
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<ImageResult> {
    const available = await this.getAvailableProviders();

    for (const provider of available) {
      try {
        return await provider.generate(prompt, options);
      } catch (err) {
        console.warn(`[${provider.id}] 生成失败，尝试下一个`, err);
        continue;
      }
    }

    throw new Error('所有 Provider 均不可用，请检查网络或配额');
  }

  private async getAvailableProviders(): Promise<IImageProvider[]> {
    const checks = await Promise.all(
      this.providers.map(async p => ({ provider: p, ok: await p.isAvailable() }))
    );
    return checks
      .filter(c => c.ok)
      .map(c => c.provider)
      .sort((a, b) => a.priority - b.priority);
  }
}
```

### 5.4 配额系统（QuotaService）

- 每个 Provider 独立维护配额数据
- 本地持久化（Electron 文件系统）
- 提供可视化进度条组件 `<QuotaBar />`
- 配额耗尽时自动触发 Provider 降级

### 5.5 UI 模块结构

**侧边栏（Sidebar）**

| 入口          | 功能                      |
| ------------- | ------------------------- |
| 今日抽卡      | 触发 DayCard 工作流       |
| 历史记录      | 浏览已生成图像            |
| Provider 管理 | 查看/切换/配置各 Provider |
| 配额查看      | 各 Provider 实时配额状态  |
| 设置          | API Key、生成参数、主题   |

**主内容区**

- 图像卡片网格（ImageGrid）
- Provider 来源标识
- 收藏、重新生成、保存操作按钮

------

## 六、业务流程

### 6.1 图像生成主流程

```
用户输入 Prompt
       │
       ▼
  参数校验与补全
       │
       ▼
  ProviderManager
  （按优先级选取可用 Provider）
       │
       ▼
  Adapter 调用对应平台 API
       │
     ┌─┴─────────────────┐
   成功                  失败
     │                    │
     ▼                    ▼
返回 ImageResult      自动切换下一 Provider
     │                  （最多重试 3 次）
     ▼
  UI 渲染卡片
     │
     ▼
  本地缓存 & 写入历史记录
```

### 6.2 每日抽卡（DayCard）工作流

| 步骤   | 操作                 | 说明                                        |
| ------ | -------------------- | ------------------------------------------- |
| Step 1 | 用户点击「今日抽卡」 | 触发工作流入口                              |
| Step 2 | 系统构建今日 Prompt  | 基于日期/主题模板自动生成 Prompt 与风格参数 |
| Step 3 | Provider 选择        | 默认主 Provider，额度不足时自动降级         |
| Step 4 | 图像生成             | 调用 API，同步扣减配额，写入生成记录        |
| Step 5 | 展示结果             | 用户可收藏、重新生成或保存到本地            |

------

## 七、接口定义

### 7.1 IPC 通信（Electron 主进程 ↔ 渲染进程）

| Channel           | 方向            | 描述               |
| ----------------- | --------------- | ------------------ |
| `image:generate`  | Renderer → Main | 触发图像生成       |
| `image:result`    | Main → Renderer | 返回生成结果       |
| `provider:list`   | Renderer → Main | 获取 Provider 列表 |
| `provider:switch` | Renderer → Main | 切换活跃 Provider  |
| `quota:get`       | Renderer → Main | 获取配额信息       |
| `quota:update`    | Main → Renderer | 配额变更推送       |
| `cache:save`      | Main 内部       | 图像持久化到本地   |

### 7.2 新增 Provider 接入步骤

> 平均接入时间：≈ 10 分钟

1. 在 `src/providers/` 下新建目录，例如 `src/providers/myprovider/`
2. 创建 `MyProvider.ts`，实现 `IImageProvider` 接口（参见第五章）
3. 实现 `generate()`、`isAvailable()`、`getQuota()` 三个方法
4. 在 `ProviderManager` 中注册并设置优先级
5. 在 Provider 管理 UI 中添加对应配置项

------

## 八、错误处理与风险控制

### 8.1 风险矩阵

| 风险类型      | 触发条件              | 控制策略                    |
| ------------- | --------------------- | --------------------------- |
| API 不可用    | Provider 接口返回错误 | 自动切换下一优先级 Provider |
| 成本失控      | 单日调用超出预算      | 配额硬限制，超限拦截请求    |
| 网络超时      | 请求超过 30s 无响应   | Retry（指数退避）+ Fallback |
| 平台封禁/限流 | 429 / 403 响应        | 自动切换国内备用 Provider   |
| 响应质量差    | 图像尺寸/内容异常     | 结果校验，不合格自动重试    |
| 离线环境      | 无网络连接            | 展示本地缓存历史图像        |

### 8.2 重试策略

```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  backoffMs: [1000, 2000, 4000],   // 指数退避
  retryOnStatus: [429, 500, 502, 503],
};
```

### 8.3 Provider 降级顺序

```
GPT-image-2（主）
     │ 失败
     ▼
DALL·E 3
     │ 失败
     ▼
Stability AI
     │ 失败
     ▼
智谱 CogView / 通义万象（国内环境）
     │ 全部失败
     ▼
抛出用户可见错误，提示检查配置
```

------

## 九、扩展指南

### 9.1 接入本地模型（如 Stable Diffusion WebUI）

```typescript
class LocalSDProvider implements IImageProvider {
  id = 'local-sd';
  name = 'Stable Diffusion (Local)';
  priority = 10;  // 本地模型优先级最高，成本为零

  async generate(prompt: string): Promise<ImageResult> {
    const res = await fetch('http://127.0.0.1:7860/sdapi/v1/txt2img', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, steps: 20 }),
    });
    const data = await res.json();
    return {
      url: `data:image/png;base64,${data.images[0]}`,
      provider: this.id,
      cost: 0,
      metadata: { prompt, generatedAt: new Date().toISOString(), width: 512, height: 512 },
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      await fetch('http://127.0.0.1:7860/sdapi/v1/options');
      return true;
    } catch {
      return false;
    }
  }

  async getQuota(): Promise<QuotaInfo> {
    return { used: 0, total: Infinity, unit: 'count' };
  }
}

```

### 9.2 未来扩展方向

| 方向            | 描述                             | 优先级 |
| --------------- | -------------------------------- | ------ |
| 视频生成        | 接入 Sora、Runway 等视频生成 API | 中     |
| 音频生成        | 配合图像生成背景音效             | 低     |
| 多模态卡片      | 图文混排、动态卡片               | 高     |
| AI Agent 自动化 | Agent 自动生成每日主题与卡片     | 高     |
| 插件市场        | 社区贡献 Provider 与模板         | 中     |
| 企业私有模型    | 私有化部署接入                   | 中     |

------

## 十、Mock Provider（开发测试专用）

> **目标**：开发阶段零费用跑通完整流程，无需消耗真实 API 额度。

### 10.1 设计思路

由于 MockProvider 同样实现了 `IImageProvider` 接口，整个业务链路（生成 → 降级 → 配额 → UI 渲染）可以在不调用任何真实 API 的情况下完整验证。

```
开发/测试环境  →  MockProvider（本地即时返回假数据）
生产环境       →  真实 Provider（GPT-image-2 等）

```

### 10.2 MockProvider 实现

```typescript
// src/providers/mock/MockProvider.ts

class MockProvider implements IImageProvider {
  readonly id = 'mock';
  readonly name = 'Mock Provider (Dev Only)';
  readonly priority = 0; // 开发时优先级最高

  private mockImageUrl = 'https://placehold.co/1024x1024/a78bfa/ffffff?text=MOCK';
  private delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  async generate(prompt: string, options?: GenerateOptions): Promise<ImageResult> {
    await this.delay(800); // 模拟网络延迟

    // 模拟偶发失败（10% 概率），用于测试降级逻辑
    if (Math.random() < 0.1) {
      throw new Error('[Mock] 模拟随机失败，测试降级');
    }

    return {
      url: this.mockImageUrl,
      provider: this.id,
      cost: 0,
      metadata: {
        prompt,
        generatedAt: new Date().toISOString(),
        width: options?.width ?? 1024,
        height: options?.height ?? 1024,
      },
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async getQuota(): Promise<QuotaInfo> {
    return { used: 2, total: 999, unit: 'count' };
  }
}

```

### 10.3 环境切换配置

在 `ProviderManager` 注册时通过环境变量决定使用哪套 Provider：

```typescript
// src/providers/ProviderManager.ts

const isDev = import.meta.env.DEV; // Vite 内置变量

const providers: IImageProvider[] = isDev
  ? [new MockProvider()]
  : [
      new GPTImage2Provider(),
      new DallE3Provider(),
      new StabilityProvider(),
      new ZhipuProvider(),
      new AliyunProvider(),
    ];

```

```bash
# .env.development
VITE_USE_MOCK=true

# .env.production
VITE_USE_MOCK=false

```

### 10.4 可测试的场景矩阵

| 测试场景           | 实现方式                                     |
| ------------------ | -------------------------------------------- |
| 正常生成流程       | 直接返回占位图，默认行为                     |
| 模拟慢网络         | 调大 `delay` 数值（如 3000ms）               |
| 测试 Provider 降级 | 将 `isAvailable()` 改为返回 `false`          |
| 测试重试逻辑       | 前 N 次 `generate()` 抛出异常，第 N+1 次成功 |
| 测试配额耗尽       | `getQuota()` 返回 `used === total`           |
| 测试离线场景       | `isAvailable()` 返回 `false` + 清空本地缓存  |

### 10.5 注意事项

- MockProvider **仅用于开发与测试**，生产构建中应通过环境变量将其完全排除
- 建议在 CI 流程中始终使用 MockProvider，避免测试管道产生真实费用
- `priority = 0` 确保开发环境下 Mock 永远优先于其他 Provider

------

## 十一、附录

### 11.1 数据流总览

```
用户输入 Prompt
    │
    ▼
Provider Router（优先级排序 + 可用性检查）
    │
    ▼
Image API 调用（各平台 Adapter）
    │
    ▼
Result Normalize（归一化为 ImageResult）
    │
    ▼
本地 Cache（Electron 文件系统）
    │
    ▼
UI Display（React 渲染卡片）

```

### 11.2 项目优势总结

| 维度              | 说明                                  |
| ----------------- | ------------------------------------- |
| 多平台统一接入    | 一套接口管理所有 AI 图像服务          |
| Electron 原生体验 | 文件系统、通知、离线能力完整支持      |
| React 高质量 UI   | 组件化、状态驱动、易于维护            |
| Adapter 插件架构  | 新 Provider 接入成本极低（≈ 10 分钟） |
| 成本可控          | 配额系统防止费用失控                  |
| 高扩展性          | 支持视频、音频、Agent 等未来方向      |

### 11.3 术语表

| 术语     | 说明                                        |
| -------- | ------------------------------------------- |
| Provider | AI 图像生成服务提供方（如 OpenAI、阿里云）  |
| Adapter  | 将具体 Provider API 适配为统一接口的实现层  |
| DayCard  | 每日抽卡功能，系统自动生成今日主题图像      |
| Quota    | 各 Provider 的调用配额，支持本地持久化      |
| IPC      | Electron 主进程与渲染进程之间的通信机制     |
| Fallback | Provider 失败时自动切换备用 Provider 的机制 |

------

_本文档由 DayCard-Image 研发团队维护，如有疑问请提交 Issue 或联系项目负责人。_
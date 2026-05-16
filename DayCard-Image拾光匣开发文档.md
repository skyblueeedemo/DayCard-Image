# DayCard-Image（拾光匣）技术开发文档

**版本**: v1.2.0（规划中）
**更新时间**: 2026-05-16
**状态**: 开发中（v1.0.0 / v1.1.0 已交付，v1.2.0 规划中）

------

## 目录

1. [项目概述](#一项目概述)
2. [技术栈](#二技术栈)
3. [系统架构](#三系统架构)
4. [Provider 接入规范](#四provider-接入规范)
5. [核心模块设计](#五核心模块设计)
6. [业务流程](#六业务流程)
7. [接口定义](#七接口定义)
8. [错误处理与风险控制](#八错误处理与风险控制)
9. [扩展指南](#九扩展指南)
10. [Mock Provider（开发测试专用）](#十mock-provider开发测试专用)
11. [系统集成模块（v1.1.0）](#十一系统集成模块v110)
12. [质量强化模块（v1.2.0）](#十二质量强化模块v120)
13. [附录](#十三附录)

------

## 一、项目概述

**DayCard-Image（拾光匣）** 是一款基于 **Electron + React** 构建的跨平台 AI 图像生成桌面应用，通过统一的 Provider Adapter 模式屏蔽各 AI 平台的接口差异，为用户提供一致、稳定的图像生成体验。核心卖点是**一键生成今日主题图像并设为桌面壁纸**。

### 1.1 设计目标

| 目标 | 描述 |
|------|------|
| 多平台统一接入 | 通过统一接口管理多家 AI 图像生成服务 |
| 热切换 Provider | 运行时无感切换图像生成后端 |
| 桌面级原生体验 | 结合 Electron 提供系统级能力（壁纸、托盘、通知、离线等） |
| 可扩展生态 | 插件化架构，支持快速接入新 Provider |
| 每日仪式感 | 定时自动生图 + 设为壁纸，形成用户每日使用习惯 |

### 1.2 核心设计理念

> DayCard-Image 不是一个单一的图像工具，而是**一个可持续演化的 AI 能力接入平台**。
>
> Provider ≠ 功能；Provider = 可替换的基础设施。

用户无需关心底层 API 差异、平台限制或网络环境，系统自动完成调度与降级。

### 1.3 版本路线图

| 版本 | 状态 | 核心特性 |
|------|------|--------|
| v0.1.0 | ✅ 已发布 | 项目骨架 + IImageProvider 接口 + OpenAIProvider |
| v0.2.0 | ✅ 已发布 | MockProvider + 完整 MVP 链路 + Provider 管理 UI |
| v0.3.0 | ✅ 已发布 | 多 Provider 接入 + 历史持久化 + 图像保存 + 每日主题 |
| v1.0.0 | ✅ 已发布 | 单元测试 + 错误边界 + 键盘快捷键 + README 完善 |
| v1.1.0 | ✅ 已发布 | 壁纸设置 + 系统托盘 + 自启动 + 定时生图 + Onboarding |
| v1.2.0 | ⏳ 规划中 | SQLite 配额 + Prompt 词库 + 离线检测 + 自动更新 |

### 1.4 项目目录结构（含规划模块）

```
daycard-image/
├── electron/                     # Electron 主进程
│   ├── main.ts
│   ├── preload.ts
│   ├── tray/
│   │   └── TrayManager.ts        # 系统托盘（v1.1.0）
│   ├── services/
│   │   ├── WallpaperService.ts   # 壁纸设置（v1.1.0）
│   │   ├── AutoLaunchService.ts  # 开机自启（v1.1.0）
│   │   ├── SchedulerService.ts   # 定时任务（v1.1.0）
│   │   ├── QuotaService.ts       # SQLite 配额（v1.2.0）
│   │   ├── NetworkService.ts     # 网络检测（v1.2.0）
│   │   ├── ImageValidator.ts     # 图像校验（v1.2.0）
│   │   └── UpdateService.ts      # 自动更新（v1.2.0）
│   └── ipc/
│       ├── imageGeneration.ts
│       ├── fileSystem.ts
│       ├── wallpaper.ts          # 壁纸 IPC（v1.1.0）
│       ├── system.ts             # 系统 IPC（v1.1.0）
│       └── quota.ts              # 配额 IPC（v1.2.0）
├── src/
│   ├── components/
│   │   ├── DailyCard/
│   │   ├── ProviderSelector/
│   │   ├── QuotaBar/
│   │   ├── ImageGrid/
│   │   ├── History/
│   │   ├── ProviderManager/
│   │   ├── Onboarding/           # 首次启动引导（v1.1.0）
│   │   ├── Sidebar.tsx
│   │   └── ErrorBoundary.tsx
│   ├── providers/
│   │   ├── IImageProvider.ts
│   │   ├── ProviderManager.ts
│   │   ├── bootstrap.ts
│   │   ├── openai/
│   │   ├── stability/
│   │   ├── zhipu/
│   │   ├── aliyun/
│   │   └── mock/
│   ├── prompts/                  # Prompt 词库（v1.2.0）
│   │   ├── styleLibrary.json
│   │   ├── sceneLibrary.json
│   │   └── compositionLibrary.json
│   ├── store/
│   │   ├── generationStore.ts
│   │   └── persistenceStore.ts
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useWallpaper.ts       # 壁纸 hook（v1.1.0）
│   │   └── useNetworkStatus.ts   # 网络状态 hook（v1.2.0）
│   └── utils/
│       ├── dailyTheme.ts
│       └── promptEngine.ts       # 词库引擎（v1.2.0）
├── config/
│   ├── local.example.json
│   └── local.json
└── package.json
```

------

## 二、技术栈

### 2.1 技术选型

| 层级 | 技术方案 | 说明 |
|------|----------|------|
| Desktop Runtime | Electron | 跨平台桌面壳，提供 Node.js 系统能力 |
| UI Framework | React 18 | 组件化 UI，Hooks 驱动状态 |
| 样式方案 | TailwindCSS | 原子化 CSS，快速构建 |
| 状态管理 | Zustand | 轻量全局状态 |
| API 接入 | Provider Adapter Pattern | 统一多平台接口 |
| 语言 | TypeScript | 全栈类型安全 |
| 构建工具 | Vite + electron-builder | 快速编译与打包 |
| 测试框架 | vitest | 单元测试 |
| 本地数据库 | better-sqlite3（v1.2.0） | 配额与生成日志持久化 |
| 图像处理 | sharp（v1.1.0） | 壁纸尺寸裁剪与缩放 |
| 定时任务 | node-cron（v1.1.0） | 每日自动生图调度 |
| 自启动 | auto-launch（v1.1.0） | 跨平台开机自启 |
| 自动更新 | electron-updater（v1.2.0） | 应用更新 |

### 2.2 依赖版本要求

| 依赖 | 版本要求 |
|------|----------|
| Node.js | >= 18.0.0 |
| Electron | >= 28.0.0 |
| React | >= 18.2.0 |
| TypeScript | >= 5.0.0 |

------

## 三、系统架构

### 3.1 分层架构总览

```
┌─────────────────────────────────────────────────┐
│                   UI Layer                       │
│          React + TailwindCSS                     │
│   DailyCard · ProviderSelector · ImageGrid       │
│   Onboarding · Settings · History               │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              Application Layer                   │
│        业务逻辑 · 状态管理 · 任务调度              │
│   ProviderManager · QuotaService · RetryQueue    │
│   SchedulerService · NetworkService             │
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
│  文件系统 · 壁纸设置 · 系统通知 · 托盘 · SQLite    │
│  开机自启 · 自动更新 · 离线检测                    │
└─────────────────────────────────────────────────┘
```

### 3.2 各层职责说明

**UI Layer**
- 负责用户交互与状态反馈
- 组件化设计，状态驱动渲染
- 关键页面：抽卡主页、Provider 管理、配额面板、历史记录、设置、Onboarding

**Application Layer**
- Provider 热切换与调度
- Prompt 词库管理与随机抽取
- 请求队列与重试机制
- 错误恢复与降级策略
- 定时任务调度（v1.1.0）
- 网络状态检测（v1.2.0）

**Provider Adapter Layer**（核心）
- 统一 `IImageProvider` 接口，屏蔽各平台差异
- 处理参数映射、鉴权、返回格式归一化
- 统一输出 `ImageResult` 数据结构

**System Layer**
- 借助 Electron 提供文件读写、本地缓存
- 壁纸设置（v1.1.0）
- 系统托盘与通知（v1.1.0）
- SQLite 数据库（v1.2.0）
- 应用自动更新（v1.2.0）

------

## 四、Provider 接入规范

### 4.1 已接入 Provider 一览

| Provider | 类型 | 计费方式 | 推荐场景 | 状态 |
|----------|------|----------|----------|------|
| GPT-image-2 | 官方 API | 每日免费额度（5 张）+ 付费 | 默认主通道，产品级输出 | ✅ 已接入 |
| DALL·E 3 | 官方 API | 按调用计费 | 创意卡片、艺术类生成 | ✅ 已接入 |
| Stability AI | REST API | 低成本按量 | 大规模生成、实验功能 | ✅ 已接入 |
| 智谱 CogView | 国内 API | 按量计费 | 国内合规环境、中文 Prompt | ✅ 已接入 |
| 阿里云通义万象 | 国内 API | 企业 SLA | 生产级备用通道 | ✅ 已接入 |
| 自定义 Provider | 插件扩展 | 自定义 | 本地模型、私有 API | 🔌 可扩展 |

### 4.2 Provider 降级顺序

```
GPT-image-2（主）
     │ 失败 / 额度耗尽
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

## 五、核心模块设计

### 5.1 IImageProvider 接口

所有 Provider 必须实现以下统一接口：

```typescript
interface IImageProvider {
  readonly id: string;              // Provider 唯一标识
  readonly name: string;            // Provider 显示名称
  readonly priority: number;        // 调度优先级（数值越小越高）

  generate(prompt: string, options?: GenerateOptions): Promise<ImageResult>;
  isAvailable(): Promise<boolean>;
  getQuota(): Promise<QuotaInfo>;
}
```

### 5.2 统一数据结构

```typescript
interface ImageResult {
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

interface GenerateOptions {
  width?: number;
  height?: number;
  style?: string;
  quality?: 'standard' | 'hd';
  n?: number;
}

interface QuotaInfo {
  used: number;
  total: number;
  resetAt?: string;
  unit: 'count' | 'credit';
}
```

### 5.3 ProviderManager 调度逻辑

```typescript
class ProviderManager {
  async generate(prompt: string, options?: GenerateOptions): Promise<ImageResult> {
    const available = await this.getAvailableProviders();
    for (const provider of available) {
      try {
        return await provider.generate(prompt, options);
      } catch (err) {
        console.warn(`[${provider.id}] 生成失败，尝试下一个`, err);
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

### 5.4 配额系统

**v1.0.0（当前）**：localStorage 简单记录，应用层维护。

**v1.2.0（升级目标）**：迁移至 SQLite，主进程统一管理，支持按日期查询，00:01 UTC+8 自动重置。

```sql
-- v1.2.0 数据库表结构
CREATE TABLE quota_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id TEXT NOT NULL,
  date TEXT NOT NULL,          -- YYYY-MM-DD 格式
  used INTEGER DEFAULT 0,
  total INTEGER DEFAULT 5,
  reset_at TEXT
);

CREATE TABLE generation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT NOT NULL,
  prompt TEXT,
  provider_id TEXT,
  style TEXT,
  scene TEXT,
  composition TEXT,
  created_at TEXT,
  is_favorite INTEGER DEFAULT 0
);

CREATE TABLE prompt_preference (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dimension TEXT NOT NULL,     -- 'style' | 'scene' | 'composition'
  value TEXT NOT NULL,
  weight INTEGER DEFAULT 1
);
```

------

## 六、业务流程

### 6.1 图像生成主流程

```
用户输入 Prompt
       │
       ▼
  配额检查（v1.2.0 起为硬拦截）
       │
       ▼
  参数校验与补全
       │
       ▼
  ProviderManager（按优先级选取可用 Provider）
       │
       ▼
  Adapter 调用对应平台 API
       │
     ┌─┴─────────────────┐
   成功                  失败
     │                    │
     ▼                    ▼
图像质量校验          自动切换下一 Provider
（v1.2.0）           （最多重试 3 次）
     │
     ▼
返回 ImageResult
     │
     ▼
  UI 渲染卡片
     │
     ▼
  本地缓存 & 写入历史记录
```

### 6.2 每日抽卡工作流

| 步骤 | 操作 | 说明 |
|------|------|------|
| Step 1 | 用户点击「今日抽卡」 | 触发工作流入口 |
| Step 2 | 构建今日 Prompt | v1.0：固定7套主题；v1.2.0：三维词库随机抽取 |
| Step 3 | Provider 选择 | 默认主 Provider，额度不足时自动降级 |
| Step 4 | 图像生成 | 调用 API，同步扣减配额，写入生成记录 |
| Step 5 | 图像质量校验 | v1.2.0：尺寸校验 + URL 可访问性（失败自动重试）|
| Step 6 | 展示结果 | 用户可收藏、重新生成、保存或设为壁纸 |

### 6.3 每日自动生图流程（v1.1.0）

```
SchedulerService（每日 08:00 触发）
       │
       ├── 检查：今日是否已生成过？
       │        是 → 跳过
       │        否 → 继续
       ▼
  构建今日主题 Prompt
       │
       ▼
  ProviderManager.generate()
       │
       ▼
  写入持久化存储
       │
       ▼
  Electron 系统通知推送
  「拾光匣 · 今日图像已生成，点击查看」
       │
       ▼
  用户点击通知 → 显示主窗口 + 定位新图像
```

### 6.4 壁纸设置流程（v1.1.0）

```
用户点击 ImageCard「设为壁纸」
       │
       ▼
  下载图片到临时目录
       │
       ▼
  sharp 裁剪至主屏分辨率（cover 模式）
       │
       ▼
  归档到 ~/Pictures/DayCard-Image/wallpapers/YYYY-MM-DD_HHmmss.png
       │
       ▼
  平台壁纸 API 调用
  Win32: SystemParametersInfoW
  macOS: AppleScript / NSWorkspace
  Linux: gsettings / feh
       │
       ▼
  返回结果 → Toast 提示
```

------

## 七、接口定义

### 7.1 IPC 通信通道

**v1.0.0（已实现）**

| Channel | 方向 | 描述 |
|---------|------|------|
| `image:generate` | Renderer → Main | 触发图像生成 |
| `image:result` | Main → Renderer | 返回生成结果 |
| `provider:list` | Renderer → Main | 获取 Provider 列表 |
| `provider:switch` | Renderer → Main | 切换活跃 Provider |
| `quota:get` | Renderer → Main | 获取配额信息 |
| `quota:update` | Main → Renderer | 配额变更推送 |
| `file:save-image` | Renderer → Main | 保存图像到本地 |

**v1.1.0（新增）**

| Channel | 方向 | 描述 |
|---------|------|------|
| `wallpaper:set` | Renderer → Main | 设置桌面壁纸 |
| `system:auto-launch-get` | Renderer → Main | 读取自启动状态 |
| `system:auto-launch-set` | Renderer → Main | 设置自启动开关 |
| `system:is-first-launch` | Renderer → Main | 判断是否首次启动 |
| `system:network-status` | Main → Renderer | 网络状态变更推送 |
| `system:scheduler-trigger` | Main → Renderer | 定时任务触发通知 |

**v1.2.0（新增）**

| Channel | 方向 | 描述 |
|---------|------|------|
| `quota:increment` | Renderer → Main | 生成成功后配额 +1 |
| `preference:like` | Renderer → Main | 标记喜欢 + 词条权重 +1 |
| `preference:unlike` | Renderer → Main | 取消喜欢 |
| `update:check` | Renderer → Main | 手动检查更新 |
| `update:available` | Main → Renderer | 有新版本可用 |

### 7.2 preload API 暴露（v1.1.0）

```typescript
// electron/preload.ts
contextBridge.exposeInMainWorld('electronAPI', {
  // 已有
  generateImage: (params) => ipcRenderer.invoke('image:generate', params),
  saveImage: (url) => ipcRenderer.invoke('file:save-image', url),

  // v1.1.0 新增
  setWallpaper: (path) => ipcRenderer.invoke('wallpaper:set', path),
  getAutoLaunch: () => ipcRenderer.invoke('system:auto-launch-get'),
  setAutoLaunch: (enabled) => ipcRenderer.invoke('system:auto-launch-set', enabled),
  isFirstLaunch: () => ipcRenderer.invoke('system:is-first-launch'),
  onNetworkStatusChange: (cb) => ipcRenderer.on('system:network-status', cb),
});
```

------

## 八、错误处理与风险控制

### 8.1 风险矩阵

| 风险类型 | 触发条件 | 控制策略 |
|----------|----------|----------|
| API 不可用 | Provider 接口返回错误 | 自动切换下一优先级 Provider |
| 成本失控 | 单日调用超出预算 | v1.2.0：配额硬限制，超限前置拦截 |
| 网络超时 | 请求超过 30s 无响应 | Retry（指数退避）+ Fallback |
| 平台封禁/限流 | 429 / 403 响应 | 自动切换国内备用 Provider |
| 响应质量差 | 图像尺寸/内容异常 | v1.2.0：结果校验，不合格自动重试 |
| 离线环境 | 无网络连接 | v1.2.0：检测后展示本地缓存历史图像 |
| 渲染崩溃 | React 组件异常 | ErrorBoundary 捕获，显示恢复 UI |

### 8.2 重试策略

```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  backoffMs: [1000, 2000, 4000],  // 指数退避
  retryOnStatus: [429, 500, 502, 503],
};
```

### 8.3 图像质量校验（v1.2.0）

```typescript
class ImageValidator {
  async validate(imageUrl: string): Promise<boolean> {
    try {
      // 1. URL 可访问性检查
      const res = await fetch(imageUrl, { method: 'HEAD' });
      if (!res.ok) return false;

      // 2. 尺寸检查（通过 Content-Length 或下载后解析）
      const size = await this.getImageSize(imageUrl);
      if (size.width < 256 || size.height < 256) return false;

      return true;
    } catch {
      return false;
    }
  }
}
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

| 方向 | 描述 | 优先级 |
|------|------|--------|
| 本地模型接入 | SD WebUI / Ollama 等，成本为零 | 高 |
| 多模态卡片 | 图文混排、动态卡片 | 高 |
| AI Agent 自动化 | Agent 自动生成每日主题与卡片 | 高 |
| 视频生成 | 接入 Sora、Runway 等视频生成 API | 中 |
| 插件市场 | 社区贡献 Provider 与模板 | 中 |
| 企业私有模型 | 私有化部署接入 | 中 |
| 音频生成 | 配合图像生成背景音效 | 低 |

------

## 十、Mock Provider（开发测试专用）

> **目标**：开发阶段零费用跑通完整流程，无需消耗真实 API 额度。

### 10.1 MockProvider 实现

```typescript
class MockProvider implements IImageProvider {
  readonly id = 'mock';
  readonly name = 'Mock Provider (Dev Only)';
  readonly priority = 0;

  private mockImageUrl = 'https://placehold.co/1024x1024/a78bfa/ffffff?text=MOCK';
  private delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  async generate(prompt: string, options?: GenerateOptions): Promise<ImageResult> {
    await this.delay(800);
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

  async isAvailable(): Promise<boolean> { return true; }
  async getQuota(): Promise<QuotaInfo> {
    return { used: 2, total: 999, unit: 'count' };
  }
}
```

### 10.2 可测试的场景矩阵

| 测试场景 | 实现方式 |
|----------|----------|
| 正常生成流程 | 直接返回占位图，默认行为 |
| 模拟慢网络 | 调大 `delay` 数值（如 3000ms）|
| 测试 Provider 降级 | 将 `isAvailable()` 改为返回 `false` |
| 测试重试逻辑 | 前 N 次 `generate()` 抛出异常，第 N+1 次成功 |
| 测试配额耗尽 | `getQuota()` 返回 `used === total` |
| 测试离线场景 | `isAvailable()` 返回 `false` + 清空本地缓存 |
| 测试图像校验失败 | 返回不可访问的 URL（v1.2.0）|

> MockProvider **仅用于开发与测试**，生产构建中通过环境变量完全排除。

------

## 十一、系统集成模块（v1.1.0）

### 11.1 WallpaperService

跨平台壁纸设置服务，支持 Windows / macOS / Linux 三平台。

```typescript
// electron/services/WallpaperService.ts
class WallpaperService {
  async setWallpaper(imagePath: string): Promise<{ success: boolean; error?: string }> {
    const platform = process.platform;
    try {
      if (platform === 'win32') {
        await this.setWin32(imagePath);
      } else if (platform === 'darwin') {
        await this.setMacOS(imagePath);
      } else {
        await this.setLinux(imagePath);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  private async setMacOS(path: string) {
    const { exec } = require('child_process');
    return new Promise((res, rej) => {
      exec(
        `osascript -e 'tell application "Finder" to set desktop picture to POSIX file "${path}"'`,
        (err) => err ? rej(err) : res(null)
      );
    });
  }

  private async setLinux(path: string) {
    const { exec } = require('child_process');
    return new Promise((res, rej) => {
      exec(`gsettings set org.gnome.desktop.background picture-uri "file://${path}"`,
        (err) => err ? rej(err) : res(null)
      );
    });
  }
}
```

**壁纸归档路径**：`~/Pictures/DayCard-Image/wallpapers/YYYY-MM-DD_HHmmss.png`

**分辨率适配**：使用 `sharp` 将原图 resize + cover 裁剪至 `screen.getPrimaryDisplay().size`。

### 11.2 TrayManager

```typescript
// electron/tray/TrayManager.ts
class TrayManager {
  private tray: Tray | null = null;

  init(mainWindow: BrowserWindow) {
    this.tray = new Tray(path.join(__dirname, '../../assets/tray-icon.png'));
    this.tray.setToolTip('拾光匣 · 今日剩余 5 张');

    const menu = Menu.buildFromTemplate([
      { label: '今日抽卡', click: () => { mainWindow.show(); /* 导航到 daily */ } },
      { label: '打开拾光匣', click: () => mainWindow.show() },
      { type: 'separator' },
      { label: '退出', click: () => app.quit() },
    ]);
    this.tray.setContextMenu(menu);
    this.tray.on('double-click', () => {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
  }

  updateTooltip(remaining: number) {
    this.tray?.setToolTip(`拾光匣 · 今日剩余 ${remaining} 张`);
  }
}
```

**主窗口关闭行为**：拦截 `close` 事件，改为 `mainWindow.hide()` 保持进程存活。

### 11.3 SchedulerService

```typescript
// electron/services/SchedulerService.ts
import cron from 'node-cron';

class SchedulerService {
  private task: cron.ScheduledTask | null = null;

  start(time = '0 8 * * *') {  // 默认每日 08:00
    this.task = cron.schedule(time, async () => {
      const alreadyGenerated = await this.checkTodayGenerated();
      if (alreadyGenerated) return;

      try {
        const result = await providerManager.generate(await buildDailyPrompt());
        await saveToPersistence(result);
        new Notification({
          title: '拾光匣',
          body: '今日图像已生成，点击查看',
        }).show();
      } catch (err) {
        console.error('[Scheduler] 自动生图失败', err);
      }
    });
  }

  stop() { this.task?.stop(); }
}
```

### 11.4 Onboarding 引导流程

首次启动（`electron-store` 中 `firstLaunch` 为 `true`）时展示三步引导：

| 步骤 | 内容 | 说明 |
|------|------|------|
| Step 1 | API Key 配置 | 至少配置一个 Provider 的 Key |
| Step 2 | Provider 选择 + 探活验证 | 点击「验证」调用 `isAvailable()`，确认可用 |
| Step 3 | 偏好设置 | 是否开启自启动、是否启用每日自动生图 |

完成后写入 `firstLaunch: false`；支持跳过，后续可从设置页补全。

------

## 十二、质量强化模块（v1.2.0）

### 12.1 Prompt 三维词库

将固定的 7 套主题模板升级为结构化三维词库，基于日期 seed 稳定随机抽取组合。

**词库结构示例**：

```json
// src/prompts/styleLibrary.json
{
  "styles": [
    { "id": "cyberpunk", "label": "赛博朋克", "prompt": "cyberpunk aesthetic, neon lights" },
    { "id": "ink", "label": "水墨画", "prompt": "Chinese ink painting, brush strokes" },
    { "id": "starscape", "label": "星空摄影", "prompt": "astrophotography, milky way" },
    { "id": "oil", "label": "油画", "prompt": "oil painting, impressionist style" },
    { "id": "minimal", "label": "极简主义", "prompt": "minimalist, clean, geometric" }
  ]
}

// src/prompts/sceneLibrary.json
{
  "scenes": [
    { "id": "city", "label": "城市夜景", "prompt": "urban cityscape at night" },
    { "id": "nature", "label": "自然山水", "prompt": "mountains and rivers, landscape" },
    { "id": "space", "label": "宇宙星云", "prompt": "cosmic nebula, deep space" },
    { "id": "portrait", "label": "人物肖像", "prompt": "portrait, expressive face" },
    { "id": "architecture", "label": "建筑空间", "prompt": "architectural photography" }
  ]
}

// src/prompts/compositionLibrary.json
{
  "compositions": [
    { "id": "wide", "prompt": "8K wide-angle lens, ultra-detailed" },
    { "id": "golden", "prompt": "golden ratio composition, rule of thirds" },
    { "id": "cinematic", "prompt": "cinematic lighting, dramatic shadows" }
  ]
}
```

**PromptEngine 实现**：

```typescript
// src/utils/promptEngine.ts
function buildDailyPrompt(date: Date = new Date()): {
  prompt: string;
  style: string;
  scene: string;
  composition: string;
} {
  const seed = dateSeed(date);  // 同一天多次调用结果一致
  const style = weightedRandom(styles, weights['style'], seed);
  const scene = weightedRandom(scenes, weights['scene'], seed + 1);
  const comp = weightedRandom(compositions, weights['composition'], seed + 2);

  return {
    prompt: `${style.prompt}, ${scene.prompt}, ${comp.prompt}, high quality, detailed`,
    style: style.label,
    scene: scene.label,
    composition: comp.id,
  };
}
```

### 12.2 用户偏好权重系统

用户对图像点击「喜欢」→ 对应风格/场景词条 weight +1 → 下次抽取时加权概率更高，形成个性化推荐循环。

### 12.3 离线模式

```typescript
// electron/services/NetworkService.ts
class NetworkService {
  init(mainWindow: BrowserWindow) {
    // 定时轮询网络状态
    setInterval(() => {
      const online = net.isOnline();
      mainWindow.webContents.send('system:network-status', { online });
    }, 5000);
  }
}

// src/hooks/useNetworkStatus.ts
function useNetworkStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    window.electronAPI?.onNetworkStatusChange((_, { online }) => setOnline(online));
  }, []);
  return online;
}
```

离线时 UI 行为：
- DailyCard 顶部展示 `OfflineBanner`（「当前离线，展示历史图像」）
- 生成按钮禁用，QuotaBar 隐藏
- ImageGrid 展示本地持久化的历史图像
- 恢复在线后自动移除 Banner

------

## 十三、附录

### 13.1 数据流总览（v1.2.0）

```
用户输入 Prompt / 自动触发（定时任务）
    │
    ▼
配额检查（SQLite QuotaService）
    │ 耗尽 → 拦截 + 提示
    ▼
Provider Router（优先级 + 可用性）
    │
    ▼
Image API 调用（各平台 Adapter）
    │
    ▼
图像质量校验（ImageValidator）
    │ 失败 → 重试最多 2 次
    ▼
Result Normalize（归一化 ImageResult）
    │
    ▼
写入 generation_log（SQLite）
    │
    ▼
本地 Cache + persistenceStore
    │
    ▼
UI Display（React 渲染卡片）
    │
    ▼（用户选择「设为壁纸」）
WallpaperService → 裁剪 → 归档 → 系统壁纸 API
```

### 13.2 项目优势总结

| 维度 | 说明 |
|------|------|
| 多平台统一接入 | 一套接口管理所有 AI 图像服务 |
| Electron 原生体验 | 壁纸、托盘、通知、离线、自启动完整支持 |
| React 高质量 UI | 组件化、状态驱动、错误边界、键盘快捷键 |
| Adapter 插件架构 | 新 Provider 接入成本极低（≈ 10 分钟）|
| 成本可控 | 配额系统（v1.2.0 升级为 SQLite 硬拦截）|
| 用户习惯闭环 | 每日自动生图 + 壁纸设置，形成日常仪式感 |
| 词库个性化 | 偏好标注 → 权重迭代 → 越用越懂你 |
| 高扩展性 | 支持本地模型、视频、Agent 等未来方向 |

### 13.3 术语表

| 术语 | 说明 |
|------|------|
| Provider | AI 图像生成服务提供方（如 OpenAI、阿里云）|
| Adapter | 将具体 Provider API 适配为统一接口的实现层 |
| DayCard | 每日抽卡功能，系统自动生成今日主题图像 |
| Quota | 各 Provider 的调用配额，支持持久化与硬拦截 |
| IPC | Electron 主进程与渲染进程之间的通信机制 |
| Fallback | Provider 失败时自动切换备用 Provider 的机制 |
| PromptEngine | 基于三维词库与权重的 Prompt 随机生成引擎（v1.2.0）|
| WallpaperService | 跨平台壁纸设置服务，含分辨率适配与归档（v1.1.0）|
| Onboarding | 首次启动引导流程，帮助用户完成基础配置（v1.1.0）|

------

_本文档由 DayCard-Image 研发团队维护，如有疑问请提交 Issue 或联系项目负责人。_

# 拾光匣 · DayCard-Image 改进计划

> 版本：v1.3.0 → v2.0.0 分阶段路线图  
> 编写日期：2026-05-17  
> 最后更新：2026-05-17（dev1.3.1 Bug 修复批次 1 后同步）

---

## 当前版本状态

**已发布**：dev1.3.1（2026-05-17）

**dev1.3.1 已修复**（不再是痛点）：
- ✅ 打包时 `config/local.json` 泄露问题（`build.files` 排除规则）
- ✅ 无 API Key 时错误提示不友好（改为引导性文案）
- ✅ 今日抽卡页模型选择器初始顺序与 API 配置不同步（`ProviderSelector` 初始化读取排序 + 自动选中第一个 Provider）
- ✅ 阿里云未选模型时仍可生成（`generationStore` 前置校验 + 自动选模型）
- ✅ 历史记录 / 收藏删除需手动刷新（`onDelete` 回调链路）

---

## 项目现状概览

**技术栈**：Electron 28 + React 18 + TypeScript 5 + Zustand + TailwindCSS 3 + Vite 5

**已有亮点**
- Provider 抽象层（`IImageProvider`）设计清晰，支持多服务降级重试
- Zustand store 划分合理（generation / persistence / settings / toast）
- Electron IPC 分模块封装，主进程与渲染进程职责分明
- Vitest 单元测试覆盖 Provider 与 Store 核心逻辑

**主要痛点**（分析 src/ 与 electron/ 后归纳）

| 类别 | 问题描述 | 状态 |
|------|---------|------|
| UI 高级感 | Sidebar 使用 emoji 图标 + 纯灰底色，视觉层次平 | 待处理 |
| UI 高级感 | 主页布局为单列居中堆叠，空间利用率低，缺乏视觉焦点 | 待处理 |
| UI 高级感 | ImageCard 无骨架屏，加载态仅 spinner，体验断层 | 待处理 |
| UI 高级感 | 色彩体系仅 gray + blue，品牌色缺失，暗色模式对比度弱 | 待处理 |
| 框架/结构 | `App.tsx` 路由逻辑用字符串联合类型 + `if/else`，不可扩展 | 待处理 |
| 框架/结构 | `ApiConfigPage` 中硬编码 `DEFAULT_MODELS`，新增 Provider 需改多处 | 待处理 |
| 框架/结构 | Provider 排序存 `localStorage`，Electron 下与 `userData` 存储双写不一致 | 待处理（1.3 已局部改善，根治需阶段一 1.3） |
| 框架/结构 | `generationStore.retryGenerate` 与 `generate` 代码高度重复 | ⚠️ dev1.3.1 新增校验后重复度略增，**阶段一 1.2 优先级提升** |
| API 功能 | 模型列表为静态硬编码，无法感知服务端实际可用模型 | 待处理 |
| API 功能 | `testConnection` 仅探活，无返回模型列表、配额等信息 | 待处理 |
| API 功能 | OpenAI Provider 的 `dailyUsed` 存内存，重启归零，配额不准确 | 待处理 |
| API 功能 | 不支持 API base URL 自定义（代理 / 私有部署场景） | 待处理 |
| ~~安全~~ | ~~打包时 `config/local.json` 被打包进安装包~~ | ✅ dev1.3.1 已修复 |
| ~~体验~~ | ~~无 API Key 时报技术路径错误~~ | ✅ dev1.3.1 已修复 |
| ~~体验~~ | ~~历史记录 / 收藏删除需手动刷新~~ | ✅ dev1.3.1 已修复 |

---

## 阶段一：基础重构与代码质量（2 周）

**目标**：清除技术债，为后续功能扩展打稳地基，不破坏现有功能。

### 1.1 路由系统重构

将 `App.tsx` 中的字符串联合类型路由替换为基于配置的声明式路由表。

```typescript
// src/router/routes.ts
export const ROUTES = {
  daily: { id: 'daily', label: '今日抽卡', icon: 'Sparkles' },
  favorites: { id: 'favorites', label: '我的收藏', icon: 'Heart' },
  history: { id: 'history', label: '历史记录', icon: 'FolderOpen' },
  themeHistory: { id: 'theme-history', label: '主题回顾', icon: 'CalendarDays' },
  apiConfig: { id: 'api-config', label: 'API 配置', icon: 'KeyRound' },
  settings: { id: 'settings', label: '设置', icon: 'Settings2' },
} as const;

export type RouteId = keyof typeof ROUTES;
```

- Sidebar 与 App 均从 `ROUTES` 读取，新增页面只改一处
- 图标从 emoji 迁移至 `lucide-react`（已列入依赖）

### 1.2 消除 generate / retryGenerate 重复

> ⚠️ **优先级提升**：dev1.3.1 在两个方法中各自新增了阿里云模型校验逻辑，重复度进一步增加。建议在阶段一最先处理此项。

提取公共生成逻辑到内部函数 `_doGenerate(prompt, options)`，两个公共方法共享调用。校验逻辑（模型必选、配额检查等）也统一在 `_doGenerate` 内处理，避免后续每次新增校验都要改两处。

### 1.3 统一存储层

- 新建 `src/store/storageAdapter.ts`，统一封装 localStorage / Electron userData 读写
- Provider 排序、模型排序、Splash 标记等所有键通过此适配器读写，消除双写分散问题
- `persistenceStore` 中的 `loadAsync` 也经此适配器，fallback 逻辑集中维护

### 1.4 Provider 注册表元数据化

将 `PROVIDER_LABELS`、`DEFAULT_MODELS`、优先级等分散的硬编码合并为统一注册表：

```typescript
// src/providers/registry.ts
export const PROVIDER_REGISTRY: ProviderMeta[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    priority: 1,
    defaultModels: [...],
    baseURL: 'https://api.openai.com/v1',
    docsURL: 'https://platform.openai.com/docs',
  },
  // ...
];
```

新增 Provider 只需在此文件追加一条记录，`ApiConfigPage`、`ProviderSelector`、`imageGeneration.ts` 均从注册表读取。

### 1.5 配额持久化

`OpenAIProvider.dailyUsed` 等内存配额改写入 `storageAdapter`，重启后可恢复。格式：

```json
{ "quota": { "openai": { "used": 3, "date": "2026-05-17" } } }
```

**验收标准**：现有 30 条 Vitest 用例全部通过，新增覆盖 storageAdapter 的 5 条用例。

---

## 阶段二：API 能力升级（2 周）

**目标**：模型列表动态获取、Base URL 自定义、连接测试增强。

### 2.1 动态模型列表获取

为每个 Provider 在 `IImageProvider` 接口中增加可选方法：

```typescript
interface IImageProvider {
  // 已有方法 ...
  listModels?(): Promise<ModelMeta[]>;
}
```

各 Provider 实现：

| Provider | 获取方式 |
|----------|---------|
| OpenAI | `GET /v1/models`，过滤 `id` 含 `image` 的条目 |
| DashScope（阿里云） | `GET /compatible-mode/v1/models` |
| Stability AI | `GET /v2beta/engines/list` |
| 智谱 CogView | 静态列表（API 无公开 list 接口） |

`ApiConfigPage` 在展开 Provider 卡片时触发 `listModels()`，结果缓存 10 分钟（存 storageAdapter）。"导入默认模型" 按钮升级为"从 API 获取模型"，静态 `DEFAULT_MODELS` 作为 fallback。

### 2.2 Base URL 自定义

配置文件与 UI 均支持 `baseURL` 字段，用于：
- OpenAI 兼容接口（如 Azure OpenAI、第三方代理）
- 国内镜像加速
- 本地部署（LM Studio、Ollama 等）

`ApiConfigPage` 展开区域增加"自定义 Base URL"输入框（可折叠，默认隐藏）。

### 2.3 增强连接测试

`testConnection` 升级为返回完整探测结果：

```typescript
interface TestResult {
  ok: boolean;
  latencyMs: number;
  models?: string[];       // 若支持 listModels 则附带
  quota?: QuotaInfo;       // 若支持 getQuota 则附带
  errorCode?: string;
}
```

UI 连接测试按钮点击后展示：延迟、可用模型数量、配额信息；失败时显示错误码与建议操作。

### 2.4 OpenAI 模型扩展

`OpenAIProvider` 当前硬编码 `gpt-image-2`，升级为：
- 通过 `listModels()` 动态获取图像模型列表
- 支持 `dall-e-3`、`dall-e-2` 等
- `GenerateOptions` 增加 `model` 字段显式传递（已在 store 有 `activeModelId`，补齐 Provider 侧支持）

### 2.5 IPC 层配额持久化同步

`electron/services/QuotaService.ts` 改为每次生成后写入 userData，`getQuota` IPC 从文件读取，不再依赖内存状态。

**验收标准**：配置了 API Key 的 Provider 能在 UI 看到动态模型列表；自定义 Base URL 测试连接通过；重启后配额数据不重置。

---

## 阶段三：UI/UX 全面升级（3 周）

**目标**：建立品牌设计语言，提升整体高级感与交互细节。

### 3.1 设计 Token 体系

在 `src/assets/index.css` 中建立 CSS 变量体系，替代散落的 TailwindCSS 内联色值：

```css
:root {
  /* Brand */
  --color-brand: 250 112 112;        /* 珊瑚金 */
  --color-brand-dim: 250 112 112 / 0.12;

  /* Surface（亮色） */
  --color-surface-0: 255 255 255;
  --color-surface-1: 248 247 245;
  --color-surface-2: 240 238 234;

  /* Border */
  --color-border: 226 224 220;
  --color-border-subtle: 240 238 234;

  /* Text */
  --color-text-primary: 24 24 24;
  --color-text-secondary: 100 98 94;
  --color-text-muted: 160 158 154;
}

.dark {
  --color-surface-0: 14 14 16;
  --color-surface-1: 20 20 24;
  --color-surface-2: 28 28 34;
  --color-border: 40 40 50;
  --color-text-primary: 240 238 234;
  /* ... */
}
```

### 3.2 Sidebar 重设计

- 宽度从 `w-56` 收窄至 `w-16`（图标模式）或展开至 `w-52`，支持悬浮展开
- 图标替换为 `lucide-react` SVG，去除 emoji
- 激活项：左侧 3px 竖线（品牌色）+ 浅色背景色块，替代当前 `border-r-2`
- Logo 区域：品牌字 + 版本号分离，增加呼吸感
- 底部增加当前 Provider 状态指示（绿点 + 名称）

```
┌────────────────┐
│  📷  拾光匣    │  ← Logo 区（展开态）
├────────────────┤
│▌ ✦  今日抽卡  │  ← 激活（左竖线 + 浅底）
│   ♥  我的收藏  │
│   ▤  历史记录  │
│   📅 主题回顾  │
│   ⌘  API 配置  │
│   ⚙  设置      │
├────────────────┤
│  ● OpenAI      │  ← 当前 Provider 状态
└────────────────┘
```

### 3.3 主页布局重设计

当前主页（daily 页）为单列居中堆叠，信息密度低。改为：

**上半区（固定高度 Hero 区）**
- 大字展示今日主题（风格 + 场景 + 构图），字号 `text-4xl`，品牌渐变色
- 右侧显示日期与 Provider / 模型选择（浮于内容上方的轻量选择器）

**下半区（图像网格）**
- `ImageGrid` 改为 Masonry 布局（CSS columns 实现，无需依赖新库）
- 3 列，卡片圆角加大（`rounded-2xl`），阴影更立体

**底部吸附工具栏**
- `PromptInput` + 生成按钮吸附底部，类似 AI Chat 输入框风格
- QuotaBar 移至工具栏左侧（小尺寸）

### 3.4 ImageCard 升级

- **骨架屏**：生成中显示磨砂玻璃效果占位卡片（CSS `backdrop-filter`）
- **悬浮操作层**：鼠标悬浮时以 `opacity` 过渡显示操作按钮（壁纸 / 喜欢 / 删除），减少常态 UI 噪音
- **Provider 标签**：从色块改为右上角小胶囊，半透明磨砂风格
- **加载进度**：生成时卡片内显示脉冲动画边框（CSS `@keyframes`）
- **图片加载**：`<img>` 加 `onLoad` 触发淡入过渡，避免图片突然出现

### 3.5 ApiConfig 页面升级

- Provider 卡片改为左边框竖线状态指示（有 Key = 品牌色，无 Key = gray）
- 模型列表每行增加"当前选用"高亮标记（来自 `activeModelId`）
- 新增"从 API 获取模型"按钮，触发 `listModels()` 并 diff 更新列表
- 连接测试结果展开显示：延迟 badge + 模型数 + 配额条

### 3.6 动画与微交互

- 页面切换：`Sidebar` 导航点击后主内容区 `opacity: 0 → 1` + `translateY(4px → 0)`（CSS transition，约 150ms）
- Toast：从底部滑入，自动消失前 300ms 淡出（已有 ToastContainer，补充动画样式）
- SplashScreen：当前已有淡入淡出，保留并优化品牌文字排版

### 3.7 Onboarding 重设计

三步引导改为全屏沉浸式卡片，每步：
- 大图/插画区（可用 CSS 几何图形替代）
- 标题 + 一句说明
- 底部步骤点 + 下一步按钮

去除当前密集的表单感，增加初次体验的仪式感。

**验收标准**：Lighthouse 可访问性评分 ≥ 90；视觉 review 通过（暗色 + 亮色各截图对比）；动画不抖动、无布局偏移。

---

## 阶段四：体验打磨与发布准备（1 周）

**目标**：细节收尾，准备 v2.0.0 发布。

### 4.1 键盘快捷键完善

当前 `useKeyboardShortcuts` 已有基础，补充：

| 快捷键 | 功能 |
|--------|------|
| `Space` | 生成图像（输入框外时） |
| `1`–`6` | 切换页面 |
| `Cmd/Ctrl + ,` | 打开设置 |
| `Escape` | 关闭弹窗 / 取消编辑 |

### 4.2 错误边界增强

`ErrorBoundary.tsx` 当前仅展示通用错误信息，改为：
- 区分网络错误 / API 错误 / 本地错误，给出针对性提示
- 提供"重试"和"报告问题"（打开 GitHub Issues）按钮

### 4.3 性能优化

- `ImageGrid` 中的历史图片列表加 `React.memo` + 虚拟滚动（数量超 50 时启用 `windowing`）
- `ProviderSelector` 的 `refresh()` 加 debounce，避免短时间多次触发 IPC  
  > ⚠️ **需求更迫切**：dev1.3.1 修改后，每次打开 Provider 下拉都会触发 `refresh()`（读取排序 + 调用 `getConfig` IPC），高频操作下可能造成 IPC 拥堵，建议 debounce 300ms
- Electron 主进程 `loadConfig()` 结果缓存 5 秒，减少重复文件读取

### 4.4 自动更新 UI

`UpdateService.ts` 已有更新检查逻辑，补充前端感知：
- 有新版本时 Sidebar 底部显示小红点
- 点击展开更新日志（从 GitHub Releases 获取）并提供"立即更新"按钮

### 4.5 文档与发布

- `README.md` 增加截图（暗色 + 亮色）
- `CHANGELOG.md` 补充 v2.0.0 变更列表
- `electron-builder` 配置补充代码签名（macOS notarization / Windows EV 证书）

---

## 里程碑总览

| 阶段 | 周期 | 核心产出 |
|------|------|---------|
| 一：基础重构 | 第 1–2 周 | 路由表化、存储统一、Provider 注册表、配额持久化 |
| 二：API 能力 | 第 3–4 周 | 动态模型列表、Base URL 自定义、增强连接测试 |
| 三：UI 升级 | 第 5–7 周 | 设计 Token、Sidebar、主页布局、ImageCard、动画 |
| 四：打磨发布 | 第 8 周 | 快捷键、错误处理、性能、自动更新 UI、发布 |

---

## 依赖变更建议

| 包 | 操作 | 原因 |
|----|------|------|
| `lucide-react` | 已有 → 正式启用 | 替代 emoji 图标 |
| `@tanstack/react-virtual` | 新增（可选） | 历史列表虚拟滚动 |
| `framer-motion` 或纯 CSS | 按需 | 页面切换动画（优先 CSS transition） |

无需引入路由库（react-router），当前单页应用复杂度不需要。

---

*计划由 Claude 基于代码分析生成，实际执行优先级可按团队节奏调整。*

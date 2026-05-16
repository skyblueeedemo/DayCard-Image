# 拾光匣 (DayCard-Image)

跨平台 AI 图像生成桌面应用 — 通过统一 Provider Adapter 模式屏蔽各 AI 平台差异，提供一致、稳定的图像生成体验。一键生成今日主题图像，并将其设为桌面壁纸。

## 功能

### 已实现（v1.0.0）
- **多 Provider 统一接入**：OpenAI GPT-image-2 / DALL·E 3 / Stability AI / 智谱 CogView / 阿里云通义万象，一套接口管理
- **智能降级**：主 Provider 失败自动切换备用，指数退避重试
- **历史记录**：生成结果自动持久化，支持 Provider 筛选与排序
- **本地保存**：通过 Electron 对话框将图像保存到本地磁盘
- **每日主题**：7 套主题模板按星期轮换，一键填充 Prompt
- **配额可视化**：实时进度条展示各 Provider 额度使用情况
- **开发友好**：内置 MockProvider，零费用跑通完整流程
- **错误边界**：React ErrorBoundary 防止白屏崩溃
- **键盘快捷键**：`Ctrl/Cmd+Enter` 触发生成，`Escape` 关闭错误提示
- **单元测试**：vitest 覆盖核心模块（30 个用例全部通过）

### 已实现（v1.1.0）
- **一键设为壁纸**：Win / macOS / Linux 三平台壁纸设置，自动适配屏幕分辨率
- **壁纸归档**：按日期归档到 `~/Pictures/DayCard-Image/wallpapers/`
- **系统托盘**：常驻托盘，关闭窗口不退出，右键菜单快捷操作
- **开机自启动**：可配置开机自启，默认关闭
- **每日自动生图**：Scheduler 定时任务（每日 08:00），完成后系统通知推送
- **首次启动引导**：Onboarding 三步引导流程（API Key → Provider → 偏好设置）

### 已实现（v1.2.0）
- **配额持久化**：QuotaService JSON 文件存储，分 Provider 按日记录，历史查询
- **配额硬限制拦截**：耗用前置拦截，QuotaBar 变红 + "已耗尽" 标签
- **Prompt 三维词库**：7 风格 × 6 场景 × 4 构图词库，日期 seed 确定性随机抽取
- **用户偏好反馈**：ImageCard Like 按钮，词条权重累积，加权随机选取
- **离线检测**：NetworkService 定期探活（30s），OfflineBanner + 禁用生成
- **图像质量校验**：URL 可达 + Content-Type + 尺寸 ≥ 256px，校验失败自动重试 2 次
- **自动更新**：electron-updater 静默检查 + 设置页手动触发

---

## 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | >= 18.0.0 |
| npm | >= 9.0.0 |

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置 API Key（可选，开发模式使用 MockProvider 无需配置）
cp config/local.example.json config/local.json
# 编辑 config/local.json，填入你的 API Key

# 3. 启动开发（仅 Web 模式，MockProvider 自动启用）
npm run dev

# 4. 启动开发（Electron 桌面模式）
npm run dev:electron
```

> **首次启动提示**：v1.1.0 起，首次启动会显示 Onboarding 引导流程，帮助你完成 API Key 配置与 Provider 选择，之后可直接进入主界面。

---

## 命令速查

| 命令 | 说明 |
|------|------|
| `npm run dev` | Vite 开发服务器 (Web 模式，MockProvider) |
| `npm run dev:electron` | Vite + Electron 桌面开发 |
| `npm run build` | 构建前端 |
| `npm run build:electron` | 构建 + 打包桌面应用（三平台）|
| `npm test` | 运行单元测试（vitest）|
| `npm run lint` | ESLint 检查 |
| `npm run format` | Prettier 格式化 |
| `npm run type-check` | TypeScript 类型检查 |

---

## 项目结构

```
daycard-image/
├── src/
│   ├── providers/               # Provider Adapter 层（核心）
│   │   ├── IImageProvider.ts    # 统一接口
│   │   ├── ProviderManager.ts   # 调度 → 降级 → 重试
│   │   ├── bootstrap.ts         # 环境切换注册
│   │   ├── openai/              # GPT-image-2 / DALL·E 3
│   │   ├── stability/           # Stability AI (SD)
│   │   ├── zhipu/               # 智谱 CogView
│   │   ├── aliyun/              # 阿里云通义万象
│   │   └── mock/                # MockProvider (Dev)
│   ├── store/                   # Zustand 状态管理
│   │   ├── generationStore.ts
│   │   └── persistenceStore.ts  # localStorage 持久化
│   ├── prompts/                 # Prompt 词库（v1.2.0）
│   │   ├── styleLibrary.json    # 风格词库（≥5 条）
│   │   ├── sceneLibrary.json    # 场景词库（≥5 条）
│   │   └── compositionLibrary.json # 构图词库（≥3 条）
│   ├── components/
│   │   ├── DailyCard/           # PromptInput + DailyTheme
│   │   ├── ImageGrid/           # ImageGrid + ImageCard
│   │   ├── ProviderSelector/    # Provider 选择器
│   │   ├── QuotaBar/            # 配额可视化
│   │   ├── ProviderManager/     # Provider 管理页
│   │   ├── History/             # 历史记录页
│   │   ├── Onboarding/          # 首次启动引导（v1.1.0）
│   │   ├── Sidebar.tsx          # 导航侧边栏
│   │   └── ErrorBoundary.tsx    # 错误边界
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useWallpaper.ts      # 壁纸设置（v1.1.0）
│   │   └── useNetworkStatus.ts  # 离线检测（v1.2.0）
│   ├── utils/
│   │   ├── dailyTheme.ts        # 每日主题
│   │   └── promptEngine.ts      # 三维词库引擎（v1.2.0）
│   └── types/                   # 类型声明
├── electron/
│   ├── main.ts                  # Electron 主进程
│   ├── preload.ts               # 安全 IPC 桥接
│   ├── tray/
│   │   └── TrayManager.ts       # 系统托盘（v1.1.0）
│   ├── services/
│   │   ├── WallpaperService.ts  # 壁纸设置（v1.1.0）
│   │   ├── AutoLaunchService.ts # 开机自启（v1.1.0）
│   │   ├── SchedulerService.ts  # 定时任务（v1.1.0）
│   │   ├── QuotaService.ts      # SQLite 配额（v1.2.0）
│   │   ├── NetworkService.ts    # 网络检测（v1.2.0）
│   │   ├── ImageValidator.ts    # 图像校验（v1.2.0）
│   │   └── UpdateService.ts     # 自动更新（v1.2.0）
│   └── ipc/
│       ├── imageGeneration.ts   # Provider API 调用
│       ├── fileSystem.ts        # 文件保存
│       ├── wallpaper.ts         # 壁纸 IPC（v1.1.0）
│       ├── system.ts            # 系统功能 IPC（v1.1.0）
│       └── quota.ts             # 配额 IPC（v1.2.0）
├── config/
│   ├── local.example.json       # API Key 配置模板
│   └── local.json               # 实际配置 (gitignore)
└── package.json
```

---

## 已接入 Provider

| Provider | 优先级 | 计费 | 状态 |
|----------|--------|------|------|
| Mock (Dev Only) | 0 | 无 | 开发模式默认 |
| GPT-image-2 | 1 | 5 张/日免费 | ✅ 已接入 |
| DALL·E 3 | 2 | 按量 | ✅ 已接入 |
| Stability AI | 3 | 按量 | ✅ 已接入 |
| 智谱 CogView | 4 | 按量 | ✅ 已接入 |
| 阿里云通义万象 | 5 | 按量 | ✅ 已接入 |
| 本地 SD WebUI | 自定义 | 无 | 🔌 扩展示例 |

---

## 架构

```
┌─────────────────────────────────┐
│            UI Layer             │
│     React + TailwindCSS         │
│  PromptInput / ImageGrid / ...  │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│       Application Layer         │
│   Zustand Store / Hooks         │
│   generationStore               │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│     Provider Adapter Layer      │
│       IImageProvider            │
│  Mock | OpenAI | Stability      │
│  Zhipu | Aliyun                 │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│         System Layer            │
│          Electron               │
│  IPC / 文件系统 / 壁纸服务       │
│  托盘 / 自启动 / SQLite          │
└─────────────────────────────────┘
```

---

## 新增 Provider

1. 在 `src/providers/` 下创建目录，实现 `IImageProvider` 接口：
   ```typescript
   interface IImageProvider {
     readonly id: string;
     readonly name: string;
     readonly priority: number;
     generate(prompt: string, options?: GenerateOptions): Promise<ImageResult>;
     isAvailable(): Promise<boolean>;
     getQuota(): Promise<QuotaInfo>;
   }
   ```
2. 在 `electron/ipc/imageGeneration.ts` 中添加 API 调用 handler
3. 在 `GENERATE_HANDLERS` 中注册
4. 在 `src/providers/bootstrap.ts` 中注册到 ProviderManager
5. 平均接入时间 ≈ 10 分钟

本地模型（如 Stable Diffusion WebUI）接入示例详见 [技术开发文档](./DayCard-Image拾光匣开发文档.md) 第九章。

---

## API Key 配置

编辑 `config/local.json`（从 `local.example.json` 复制）：

```json
{
  "openai": {
    "apiKey": "sk-..."
  },
  "stability": {
    "apiKey": "sk-...",
    "engineId": "stable-diffusion-xl-1024-v1-0"
  },
  "zhipu": {
    "apiKey": "...",
    "model": "cogview-3-plus"
  },
  "aliyun": {
    "apiKey": "...",
    "model": "wanx-v1"
  }
}
```

> **安全提示**：`config/local.json` 已加入 `.gitignore`，API Key 仅在 Electron 主进程读取，不会暴露给渲染进程。

---

## 开发规范

详见 [AIVibeCoding协作规则.md](./AIVibeCoding协作规则.md)

---

## License

MIT

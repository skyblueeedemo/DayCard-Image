# 拾光匣 (DayCard-Image)

跨平台 AI 图像生成桌面应用 — 通过统一 Provider Adapter 模式屏蔽各 AI 平台差异，提供一致、稳定的图像生成体验。

## 功能

- **多 Provider 统一接入**：OpenAI / Stability AI / 智谱 CogView / 阿里云通义万象，一套接口管理
- **智能降级**：主 Provider 失败自动切换备用，指数退避重试
- **历史记录**：生成结果自动持久化，支持 Provider 筛选与排序
- **本地保存**：通过 Electron 对话框将图像保存到本地磁盘
- **每日主题**：7 套主题模板按星期轮换，一键填充 Prompt
- **配额可视化**：实时进度条展示各 Provider 额度使用情况
- **开发友好**：内置 MockProvider，零费用跑通完整流程

## 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | >= 18.0.0 |
| npm | >= 9.0.0 |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置 API Key（可选，开发模式使用 MockProvider 无需配置）
cp config/local.example.json config/local.json
# 编辑 config/local.json，填入你的 API Key

# 3. 启动开发（仅 Web 模式，MockProvider 自动启用）
npm run dev

# 3. 启动开发（Electron 桌面模式）
npm run dev:electron
```

## 命令速查

| 命令 | 说明 |
|------|------|
| `npm run dev` | Vite 开发服务器 (Web 模式) |
| `npm run dev:electron` | Vite + Electron 桌面开发 |
| `npm run build` | 构建前端 + 编译 Electron |
| `npm run build:electron` | 构建 + 打包桌面应用 |
| `npm test` | 运行单元测试 |
| `npm run lint` | ESLint 检查 |
| `npm run format` | Prettier 格式化 |
| `npm run type-check` | TypeScript 类型检查 |

## 项目结构

```
daycard-image/
├── src/
│   ├── providers/           # Provider Adapter 层（核心）
│   │   ├── IImageProvider.ts    # 统一接口
│   │   ├── ProviderManager.ts   # 调度 → 降级 → 重试
│   │   ├── bootstrap.ts         # 环境切换注册
│   │   ├── openai/              # GPT-image-2
│   │   ├── stability/           # Stability AI (SD)
│   │   ├── zhipu/               # 智谱 CogView
│   │   ├── aliyun/              # 阿里云通义万象
│   │   └── mock/                # MockProvider (Dev)
│   ├── store/                # Zustand 状态管理
│   │   ├── generationStore.ts
│   │   └── persistenceStore.ts  # localStorage 持久化
│   ├── components/
│   │   ├── DailyCard/        # PromptInput + DailyTheme
│   │   ├── ImageGrid/        # ImageGrid + ImageCard
│   │   ├── ProviderSelector/ # Provider 选择器
│   │   ├── QuotaBar/         # 配额可视化
│   │   ├── ProviderManager/  # Provider 管理页
│   │   ├── History/          # 历史记录页
│   │   ├── Sidebar.tsx       # 导航侧边栏
│   │   └── ErrorBoundary.tsx # 错误边界
│   ├── hooks/                # 自定义 Hooks
│   ├── utils/                # 工具 (每日主题)
│   └── types/                # 类型声明
├── electron/
│   ├── main.ts               # Electron 主进程
│   ├── preload.ts            # 安全 IPC 桥接
│   └── ipc/
│       ├── imageGeneration.ts    # Provider API 调用
│       └── fileSystem.ts         # 文件保存
├── config/
│   ├── local.example.json    # API Key 配置模板
│   └── local.json            # 实际配置 (gitignore)
└── package.json
```

## 已接入 Provider

| Provider | 优先级 | 计费 | 状态 |
|----------|--------|------|------|
| Mock (Dev Only) | 0 | 无 | 开发模式默认 |
| GPT-image-2 | 1 | 5 张/日免费 | 已接入 |
| Stability AI | 2 | 按量 | 已接入 |
| 智谱 CogView | 3 | 按量 | 已接入 |
| 阿里云通义万象 | 4 | 按量 | 已接入 |

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
│  IPC / 文件系统 / 本地存储      │
└─────────────────────────────────┘
```

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
4. 平均接入时间 ≈ 10 分钟

## 开发规范

详见 [AIVibeCoding协作规则.md](./AIVibeCoding协作规则.md)

## License

MIT

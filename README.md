# 拾光匣 · DayCard-Image

<p align="center">
  <b>日更壁纸 · 拾光成匣</b>
</p>

<p align="center">
  每日三组 AI 灵感主题，一键生成专属图像，设为壁纸，换种心情。
</p>

---

## 功能

- **每日灵感主题** — 15 风格 × 15 场景 × 8 构图随机组合，每日 3 组不重样，本地时间 0 点更新
- **多模型支持** — DashScope 8 模型 / OpenAI / Stability AI / 智谱 CogView，统一接口管理
- **一键壁纸** — 生成即设壁纸，自动适配屏幕分辨率，Win / macOS / Linux 全平台
- **暗夜/亮白** — 双主题外观，即时切换，重启保持
- **喜欢 & 不喜欢** — 点赞收藏独立查看，不喜欢一键删除（本地文件同步清除）
- **历史回溯** — 图像记录 + 每日主题历史，按日期检索
- **系统托盘** — 关闭窗口最小化到托盘，定时自动生图 + 系统通知
- **离线可用** — 无网络时自动切换本地历史图库
- **首次引导** — 启动页 + 样例主题 + 开始按钮，引导完成终身不再打扰
- **API 配置内置** — 应用内管理 Key（仅存本地），测试连接，模型排序

---

## 快速开始

### 环境

- **Node.js** >= 18
- **npm** >= 9

### 开发

```bash
npm install
npm run dev              # Web 模式（MockProvider 零费用跑通）
npm run dev:electron     # Electron 桌面模式
```

### 构建

```bash
npm run build            # 编译前端 + 主进程
npm run build:electron   # 编译 + 打包安装包 → release/
```

> 首次启动有 SplashScreen（3s 淡入淡出），随后进入 Onboarding 引导。API Key 可在应用内「API 配置」页面管理，仅在本地存储。

---

## 命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | Vite 开发服务器 |
| `npm run dev:electron` | Vite + Electron |
| `npm run build` | `vite build` + `tsc -p tsconfig.electron.json` |
| `npm run build:electron` | 构建 + electron-builder 打包 |
| `npm test` | vitest 单元测试 |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript 类型检查 |

---

## 项目结构

```
├── src/
│   ├── components/
│   │   ├── DailyCard/          # 今日抽卡（主题 / 输入 / 横幅 / 离线）
│   │   ├── ImageGrid/          # 图像卡片网格
│   │   ├── ProviderSelector/   # 模型服务下拉 + 模型选择
│   │   ├── ApiConfig/          # API Key 管理
│   │   ├── Settings/           # 设置页（外观 / 系统 / 关于）
│   │   ├── History/            # 历史记录 + 主题回顾
│   │   ├── Favorites/          # 我的收藏
│   │   ├── Onboarding/         # 首次引导（3 步）
│   │   ├── Toast/              # 全局 Toast
│   │   ├── Sidebar.tsx         # 侧边栏导航
│   │   ├── SplashScreen.tsx    # 启动页
│   │   └── ErrorBoundary.tsx   # 错误边界
│   ├── providers/              # Provider Adapter 层
│   │   ├── IImageProvider.ts   # 统一接口
│   │   ├── ProviderManager.ts  # 调度 / 降级 / 重试
│   │   ├── bootstrap.ts        # 按环境注册
│   │   ├── openai/ stability/ zhipu/ aliyun/ mock/
│   ├── store/                  # Zustand 状态
│   │   ├── generationStore.ts
│   │   ├── persistenceStore.ts
│   │   ├── settingsStore.ts
│   │   └── toastStore.ts
│   ├── prompts/                # 主题词库
│   │   ├── styleLibrary.json   # 15 风格
│   │   ├── sceneLibrary.json   # 15 场景
│   │   └── compositionLibrary.json  # 8 构图
│   ├── hooks/                  # 自定义 Hooks
│   ├── utils/                  # 工具函数
│   └── types/                  # 类型声明
├── electron/
│   ├── main.ts                 # 主进程入口
│   ├── preload.ts              # IPC 桥接
│   ├── storage.ts              # JSON 文件存储
│   ├── tray/                   # 系统托盘
│   ├── services/               # Wallpaper / Quota / Scheduler / Network / Update
│   └── ipc/                    # IPC handlers
├── config/
│   └── local.example.json      # 配置模板
├── build/
│   └── installer.nsh           # NSIS 卸载清理脚本
└── package.json
```

---

## 技术栈

| 层 | 技术 |
|------|------|
| 桌面容器 | Electron 28 |
| 前端 | React 18 + TypeScript 5 |
| 状态管理 | Zustand |
| 样式 | TailwindCSS 3（darkMode: class） |
| 构建 | Vite 5 |
| 测试 | Vitest（30 用例） |
| 图像处理 | sharp |
| 打包 | electron-builder（NSIS / DMG / AppImage） |
| 存储 | JSON 文件（userData）+ localStorage 双写 |

---

## 接入新模型

1. 实现 `IImageProvider` 接口（`src/providers/IImageProvider.ts`）
2. 在 `electron/ipc/imageGeneration.ts` 添加 API handler
3. 注册到 `GENERATE_HANDLERS`
4. 在 `bootstrap.ts` 注册到 ProviderManager

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

---

## API Key 配置

应用内路径：**侧边栏 → API 配置**，支持添加 Key、测试连接、导入默认模型、拖拽排序。

Key 仅存储在本地用户数据目录（`%APPDATA%/daycard-image/config.json`），不会上传至任何服务器。

---

## 版本

当前版本：**v1.4.0**（2026-05-17）

| 版本 | 状态 | 核心特性 |
|------|------|---------|
| v0.1.0 ~ v0.3.0 | ✅ | 项目骨架、MVP、Provider 生态 |
| v1.0.0 | ✅ | 测试 + 错误边界 + 键盘快捷键 |
| v1.1.0 | ✅ | 壁纸设置 + 系统托盘 + 自启动 + 定时生图 + Onboarding |
| v1.2.0 | ✅ | 配额持久化 + Prompt 三维词库 + 离线检测 + 图像校验 + 自动更新 |
| v1.2.1 | ✅ | DashScope 8 模型 + API 配置页面 + 壁纸修复 + 持久化双写 |
| dev1.3.0 | ✅ | 主题扩展（每日 3 组）+ 收藏 + 双主题外观 + 壁纸删除 + 启动页 |
| dev1.3.1 | ✅ | Bug 修复批次 1：打包隔离、错误提示、排序同步、模型校验、删除实时刷新 |
| **v1.4.0** | ✅ **当前** | 阶段一~四统一发版：基础重构、API 能力升级、UI/UX 全面升级、打磨发布 |

完整变更历史见 [CHANGELOG.md](./CHANGELOG.md)，未来路线图见 [DayCard-Image改进计划.md](./DayCard-Image改进计划.md)。

---

## License

MIT

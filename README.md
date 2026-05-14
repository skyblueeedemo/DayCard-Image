# 拾光匣 (DayCard-Image)

跨平台 AI 图像生成桌面应用 — 通过统一 Provider Adapter 模式屏蔽各 AI 平台差异，提供一致、稳定的图像生成体验。

## 技术栈

| 层级 | 方案 |
|------|------|
| Desktop Runtime | Electron 28+ |
| UI | React 18 + TailwindCSS |
| 语言 | TypeScript 5+ (strict) |
| 构建 | Vite + electron-builder |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置 API Key
cp config/local.example.json config/local.json
# 编辑 config/local.json，填入你的 API Key

# 3. 启动开发
npm run dev:electron
```

## 项目结构

```
src/
├── components/       # React UI 组件
├── providers/        # Provider Adapter 层（核心）
│   ├── IImageProvider.ts
│   ├── ProviderManager.ts
│   └── openai/       # GPT-image-2
├── store/            # 状态管理 (Zustand)
├── hooks/            # 自定义 Hooks
├── types/            # 类型声明
└── assets/           # 样式与静态资源
electron/             # Electron 主进程
config/               # API Key 配置（local.json 不入库）
```

## 已接入 Provider

| Provider | 优先级 | 免费额度 | 状态 |
|----------|--------|----------|------|
| GPT-image-2 | 1 (主) | 5 张/日 | 开发中 |
| DALL·E 3 | 2 | 无 | 待接入 |
| Stability AI | 3 | — | 待接入 |
| 智谱 CogView | 4 | — | 待接入 |
| 阿里云通义万象 | 5 | — | 待接入 |

## 开发规范

详见 [AIVibeCoding协作规则.md](./AIVibeCoding协作规则.md)

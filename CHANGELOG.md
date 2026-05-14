# Changelog

所有值得注意的变更记录在此文件中。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [0.1.0] - 2026-05-14

### Added

- 项目初始化：Electron + React + TypeScript + Vite + TailwindCSS 骨架
- `IImageProvider` 统一接口定义（generate / isAvailable / getQuota）
- `ProviderManager` 调度器：按优先级切换、失败自动降级、指数退避重试
- `OpenAIProvider`（GPT-image-2）：首个 Provider Adapter，每日免费 5 张
- Electron 主进程 + preload + IPC 通道骨架
- React 前端骨架：Sidebar 导航 + 页面路由占位 + ImageGrid 空状态
- TailwindCSS 暗色主题
- ESLint + Prettier 代码规范配置
- TypeScript strict mode 配置
- API Key 管理：`config/local.example.json` 模板
- `.gitignore`：排除 `config/local.json`、`node_modules/`、构建产物
- `AIVibeCoding协作规则.md`：补全所有项目约束字段
- `README.md`：项目概览
- `tasks.md`：任务跟踪文档（本文件）
- `CHANGELOG.md`：变更日志（本文件）

### Changed

- （首次发布，无变更）

### Fixed

- （首次发布，无修复）

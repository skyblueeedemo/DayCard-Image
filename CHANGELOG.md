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

---

## [0.2.0] - 2026-05-15

### Added

- **MockProvider**：开发测试专用 Provider，零费用跑通完整链路
  - 800ms 模拟延迟 + 10% 随机失败（测试降级逻辑）
  - 占位图返回，开发环境自动注册
- **Provider 启动注册**：`bootstrap.ts` 根据环境自动选择 Mock/真实 Provider
- **Zustand 生成状态管理**：`generationStore` 统一管理 prompt、isGenerating、results、error、activeProviderId
- **PromptInput 组件**：多行文本输入 + 生成按钮，含 loading/disabled/error 状态
- **ImageGrid 实际渲染**：ImageCard 组件，显示缩略图、Provider 标签、时间戳、Copy URL
- **ProviderSelector 组件**：下拉列表显示所有已注册 Provider，含可用状态指示、点击切换
- **QuotaBar 组件**：进度条可视化当前 Provider 配额（used/total），颜色随用量变化
- **ProviderList 组件**：Provider 管理页面，展示所有已注册 Provider 详情与配额
- **Settings 页面**：API Key 配置说明 + 关于信息
- **Electron IPC 真实实现**：`electron/ipc/imageGeneration.ts` 在主进程加载 config、管理配额、调用 API
- **DailyCard 页面组装**：QuotaBar → ProviderSelector → PromptInput → ImageGrid 完整交互链路

### Changed

- `App.tsx`：从占位页面升级为真实组件集成
- `main.tsx`：启动时调用 `bootstrapProviders()` 注册 Provider
- `electron/main.ts`：IPC handlers 替换为真实调用
- `ImageGrid.tsx`：从空状态占位升级为 store 驱动的图像卡片网格

---

## [0.3.0] - 2026-05-15

### Added

- **Stability AI Provider**：SD 系列 Adapter，REST API 调用，base64 图像响应
- **智谱 CogView Provider**：中文 Prompt 友好，国内合规环境首选
- **阿里云通义万象 Provider**：异步任务 + 轮询模式，企业级生产备用
- **Electron IPC 多 Provider 支持**：`GENERATE_HANDLERS` 模式，主进程统一管理 API Key
- **结果持久化层**：localStorage 封装，自动保存/加载，上限 500 条自动裁剪
- **历史记录页面**：Provider 筛选 + 日期排序 + 刷新，复用 ImageGrid 组件
- **图像保存到本地**：Electron save dialog + 数据下载，支持 PNG/JPG 格式
- **ImageCard 操作增强**：保存到本地（Electron） / 复制 URL（Web）降级、重新生成（retry）
- **每日主题自动 Prompt**：7 套主题模板按星期轮换，点击填充 Prompt

### Changed

- `generationStore.ts`：新增持久化集成 + retryGenerate action
- `ImageGrid.tsx`：支持外部 results/loading props，可复用为通用网格
- `ImageCard.tsx`：新增保存和重新生成按钮 + toast 提示
- `App.tsx`：历史页接入 HistoryPage，每日页接入 DailyTheme
- `Sidebar.tsx`：版本号更新为 v0.2.0
- `electron/main.ts`：注册 file:save-image IPC handler
- `electron/preload.ts`：暴露 saveImage API
- `electron/ipc/imageGeneration.ts`：重构为 handler map 模式，支持 openai/stability/zhipu/aliyun
- `config/local.example.json`：新增 stability/engineId、zhipu/model、aliyun/model 字段


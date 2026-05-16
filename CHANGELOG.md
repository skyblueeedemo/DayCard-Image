# Changelog

所有值得注意的变更记录在此文件中。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [Unreleased]

> 以下内容为开发中功能，发布时移入对应版本节点。

---

## [1.2.0] - 待发布

> 阶段 5：质量强化

### Added

- **SQLite 配额持久化**：`QuotaService` 替换 localStorage，分 Provider 按日记录，支持历史查询；数据库文件位于 `userData/daycard.db`
- **配额硬限制拦截**：当日额度耗尽时，生成前直接拦截并提示，不触发 API 调用；QuotaBar 变红警示
- **Prompt 词库重构**：风格 × 场景 × 构图三维 JSON 词库（`src/prompts/`），`promptEngine.ts` 基于日期 seed 稳定随机抽取
- **用户偏好标签**：ImageCard 新增「喜欢」按钮，对应词条 weight +1，下次抽取加权概率提升
- **Prompt 历史与好图关联**：SQLite `generation_log` 表记录每次生成的 Prompt + Provider + 词条组合；历史页面支持收藏筛选
- **离线检测**：`NetworkService` 监听网络状态，离线时展示 OfflineBanner，生成按钮禁用，自动展示历史图库
- **图像质量校验**：`ImageValidator` 校验 URL 可访问性 + 尺寸 ≥ 256px，校验失败自动重试最多 2 次
- **electron-updater 自动更新**：启动后 5s 静默检查 GitHub Releases，有更新时弹出提示；设置页支持手动检查更新

### Changed

- `dailyTheme.ts`：调用新的 `promptEngine`，保留主题卡片展示，DailyTheme 卡片展示本日抽取的风格 + 场景名
- `generationStore.ts`：quota 读写改走 IPC（QuotaService），不再直接操作 localStorage
- `QuotaBar.tsx`：数据源切换为 SQLite IPC，耗尽时红色警示 + 提示文案
- `ImageCard.tsx`：新增「喜欢」按钮，展示使用的 Prompt 和词条组合（展开时）
- `HistoryPage.tsx`：支持按收藏筛选；ImageCard 展开时显示 Prompt 详情
- `Settings.tsx`：显示当前版本号 + 「检查更新」按钮

### Fixed

- localStorage 配额在跨日场景下偶发不重置的问题（SQLite 按 date 字段判断，逻辑更稳定）

---

## [1.1.0] - 2026-05-16

> 阶段 4：系统集成 — 15 个新文件，7 个修改文件

### Added

- **WallpaperService**：跨平台壁纸设置（Win32 PowerShell / macOS osascript / Linux gsettings），`wallpaper:set` IPC 通道
- **壁纸分辨率适配**：`sharp` 自动 resize+cover 裁剪至主屏分辨率，归档至 `~/Pictures/DayCard-Image/wallpapers/YYYY-MM-DD_HHmmss.png`
- **ImageCard「设为壁纸」按钮**：Electron 环境下可用，点击直接调用 wallpaper IPC，含 toast 反馈
- **全局 Toast 系统**：`toastStore`（Zustand）+ `ToastContainer` 组件，支持 success/error/info 三种类型，3 秒自动消失
- **系统托盘（Tray）**：`TrayManager` 管理程序化生成托盘图标；关闭主窗口时最小化到托盘（不退出）；右键菜单：今日抽卡 / 打开拾光匣 / 退出；双击显示/隐藏主窗口
- **开机自启动**：`AutoLaunchService`（基于 `auto-launch`），设置页 toggle 控制，开发模式自动跳过，状态持久化到 electron-store
- **Scheduler 定时任务**：`SchedulerService`（node-cron）按配置时间自动生图，完成后推送 Electron Notification + `scheduler:completed` IPC 事件
- **Onboarding 引导流程**：首次启动展示三步引导（API Key → Provider → 偏好），`firstLaunch` 标记持久化，支持跳过
- **Settings 页面重构**：从 App.tsx 提取为独立组件，新增「开机自启动」/「每日自动生图」toggle + 时间选择器
- **全局设置持久化**：`SettingsService`（electron-store）+ `settingsStore`（Zustand），`settings:get/set` IPC 通道

### Changed

- `electron/main.ts`：集成 TrayManager、WallpaperService、AutoLaunchService、SchedulerService，窗口关闭改为隐藏到托盘
- `electron/preload.ts`：新增 `setWallpaper`、`getSettings`、`updateSetting`、`onEvent`（白名单通道）API
- `App.tsx`：提取 MainApp 子组件，新增 onboarding 条件渲染、ToastContainer、托盘/调度器事件监听
- `Settings.tsx`：从 App.tsx 提取为独立文件，新增交互式控件（Toggle）
- `ImageCard.tsx`：新增「设为壁纸」按钮
- `Sidebar.tsx`：版本号更新为 v1.1.0
- `package.json`：版本号升级为 1.1.0，新增 `electron-store`、`sharp`、`auto-launch`、`node-cron` 依赖

---

## [1.0.0] - 2026-05-16

### Added

- **单元测试**：vitest 测试覆盖 ProviderManager（注册/降级/重试）、MockProvider（生成/可用性/配额）、generationStore（状态流转/成功/失败路径）
- **错误边界**：ErrorBoundary 组件捕获渲染异常，显示错误信息与重新加载按钮，DEV 模式下展示堆栈
- **键盘快捷键**：`Ctrl/Cmd+Enter` 触发生成，`Escape` 关闭错误提示
- **README 完善**：功能列表、安装指南、命令速查、完整项目结构、架构图、Provider 接入指南

### Changed

- `main.tsx`：App 包裹 ErrorBoundary
- `App.tsx`：注册 useKeyboardShortcuts hook
- `package.json`：版本升级为 1.0.0，`build:electron` 脚本修复（增加 tsc 编译步骤）
- `README.md`：从概览升级为完整用户/开发者文档

### Fixed

- `build:electron` 脚本缺少 `tsc -p tsconfig.electron.json` 步骤，改为 `npm run build && electron-builder`
- vitest 测试超时：ProviderManager retry 测试改用 fake timers 跳过退避延时
- vitest mock 提升问题：generationStore 测试 `vi.mock` 变量改用 `vi.hoisted()`
- postcss.config.js ESM/CommonJS 类型警告：改用 `module.exports`

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
- `tasks.md`：任务跟踪文档
- `CHANGELOG.md`：变更日志

### Changed

- （首次发布，无变更）

### Fixed

- （首次发布，无修复）

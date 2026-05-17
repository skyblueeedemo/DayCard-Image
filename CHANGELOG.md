# Changelog

所有值得注意的变更记录在此文件中。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [Unreleased]

> 以下内容为开发中功能，发布时移入对应版本节点。

---

## [1.4.1] - 2026-05-17

> 自动更新功能恢复 — 1 个新文件，2 个修改文件

### Added

- **自动更新功能**：从 v1.4.0 的 toast 降级提示恢复为完整 electron-updater 集成
  - 启动后 5 秒静默检查 GitHub Releases
  - 检测到新版本后弹出提示，用户决定下载（不自动下载）
  - 下载完成后用户决定重启安装（二次确认）
  - 设置页关于区状态机 UI：idle / checking / available / not-available / downloading / downloaded / error 七态
  - 仅 `app.isPackaged` 时生效，开发模式跳过

### Changed

- **package.json publish**：`<your-github-username>` / `<your-repo-name>` 占位符替换为 `skyblueeedemo` / `DayCard-Image`，electron-updater 现在能正确从 GitHub Releases 拉取 `latest.yml`

### Fixed

- 用户反馈「检查更新只弹 toast 不真检查」回归问题

---

## [1.4.0] - 2026-05-17

> 阶段一~四统一发版：基础重构 + API 能力升级 + UI/UX 全面升级 + 打磨发布 — 共 53 个 commit

### Added (阶段四)

- **键盘快捷键扩展**：Ctrl/Cmd + ,（跳转设置）+ Ctrl/Cmd + 1~6（按 ROUTES 顺序切换页面）；通过自定义事件 `daycard:navigate` 解耦
- **ErrorBoundary 增强**：错误概要卡片始终显示（错误名 + 时间戳 + 消息）；新增「报告问题」按钮跳转 GitHub Issues 自动填充错误信息
- **dev/main 双分支工作流**：日常 commit 推 `dev`，稳定快照合并到 `main` 并打 tag 发版

### Changed (阶段四)

- **页面切换跳转**：原"navigate-to" Electron 事件 + Sidebar 点击切换的两条路径，现新增第三条「键盘快捷键」路径，全部通过 `daycard:navigate` 自定义事件汇聚到 App.tsx 单点 setActivePage
- **ErrorBoundary 视觉升级**：emoji ⚠ → lucide AlertTriangle；硬编码 bg-gray-950 → surface-1 token；按钮新增 RotateCcw / ExternalLink 图标
- **package.json 版本号**：`1.3.1-dev` → `1.4.0`；UI（Sidebar 底栏 + Settings 关于）同步显示 `v1.4.0`

### Performance (阶段四)

- **ImageCard React.memo**：用 memo 包裹避免历史记录页 / 收藏页 50+ 卡片场景下父组件状态变化触发全量子组件重渲
- **ProviderSelector refresh debounce**：300ms 内多次开合下拉合并为一次 IPC 调用，避免 IPC 拥堵 + HTTP 浪费
- **主进程 loadConfig 5 秒缓存**：连续生成时复用 config.json 解析结果；config:set / config:set-order 在写入后调 invalidateConfigCache 失效缓存

---

> 以下内容来自阶段一/二/三 [Unreleased] 累积，统一发布到 v1.4.0：

### Added

- **storageAdapter 统一存储层**：`src/store/storageAdapter.ts` 封装 localStorage 读写，提供 `getJSON/setJSON/getString/setString/remove/has` 六个方法 + 13 条单元测试覆盖（含环境不可用 / JSON 异常 / quota 抛错三类边界）
- **Provider 注册表**：`src/providers/registry.ts` 集中管理 5 个 Provider 元数据（label / technicalName / priority / defaultModels / docsURL / defaultBaseURL），导出 `getProviderMeta` / `getVisibleProviders` / `getProviderLabels` / `getDefaultModels` 辅助函数
- **路由表**：`src/router/routes.ts` 集中声明 6 个页面路由（id / label / icon），导出 `ROUTES` / `RouteId` / `isRouteId` / `DEFAULT_ROUTE`
- **OpenAI Provider 配额持久化**：`OpenAIProvider.dailyUsed / lastResetDate` 通过 storageAdapter 写入 `daycard-quota-openai`，跨重启保留
- **IImageProvider.listModels**：接口新增可选方法，5 个 Provider 全部实现（OpenAI/Stability 走 API，Zhipu/Aliyun 失败 fallback 静态列表，Mock 直接返回硬编码）
- **GenerateOptions.model**：覆盖 Provider 默认模型，generationStore 在 Electron + Web 两条路径全部透传
- **config:list-models IPC**：主进程拉取动态模型列表，按 Provider 调用对应 list 接口；renderer 用 storageAdapter 缓存 10 分钟
- **testConnection 增强**：返回 `latencyMs` 延迟 + `errorCode`（HTTP_xxx / NETWORK / TIMEOUT / UNKNOWN_PROVIDER / UNKNOWN）；补全 stability / zhipu 探活路径（之前只支持 openai / aliyun）
- **自定义 Base URL**：`ProviderConfig.baseURL` 字段持久化；空字符串视为"删除字段"恢复默认；在 generate / list-models / test-connection 三条链路全部生效；UI 提供折叠输入框
- **从 API 同步模型**：ApiConfigPage 新增「从 API 同步」按钮，diff 合并到现有 config（新模型用注册表默认配额，已存在模型保留 remaining）
- **当前选用模型高亮**：ApiConfigPage 模型行新增「· 当前选用」标记
- **listModels 单元测试**：10 条测试覆盖 5 个 Provider × 成功 + 失败/fallback 路径

### Changed

- **renderer 进程 localStorage 调用**：8 处分散的 try/catch + JSON.parse 全部收敛到 storageAdapter（`providerOrder.ts` / `dailyTheme.ts` / `persistenceStore.ts` / `useAppearance.ts` / `Settings.tsx` / `ImageCard.tsx` / `DailyTheme.tsx` / `App.tsx`）
- **ApiConfigPage**：删除局部硬编码的 `PROVIDER_LABELS`（13 行）+ `DEFAULT_MODELS`（12 行），改用 `getProviderLabels(import.meta.env.DEV)` / `getDefaultModels()`
- **App.tsx + Sidebar**：删除字符串联合类型路由 + if-else 渲染 + navItems 硬编码，改用 ROUTES 声明式渲染 + RouteId 类型 + isRouteId 守卫
- **generationStore**：提取 `doGenerate(promptText, get, set)` 私有函数，`generate()` 与 `retryGenerate(p)` 共享调用，消除阿里云模型校验等逻辑的重复
- **DailyTheme.hasStarted**：storage 完全不可用时由「假装已开始」改为「显示首次使用引导」，行为更一致
- **3 个 Provider 类**：StabilityProvider / ZhipuProvider / AliyunProvider 把硬编码 URL 提到 `config.baseURL ?? default`；阿里云原 BASE_URL 拆为 DEFAULT_BASE_URL + TASK_PATH
- **3 个主进程 handler**：handleStability / handleZhipu / handleAliyun 同样改用 `config.baseURL ?? default`，handleStability + handleZhipu 同时尊重 `options.model` 覆盖
- **设计 Token 体系**：20 个组件中所有 `blue-*` 散落引用替换为 `bg-brand` / `text-brand` / `border-brand` 等语义化 token
- **Sidebar 激活态**：右侧 border-r-2 → 左侧 3px 圆角竖线 + surface-2 背景
- **Sidebar 底部**：新增当前 Provider 状态指示（绿点 + label）
- **ImageCard Provider 标签**：底部色块 → 右上角半透明胶囊（backdrop-blur-sm bg-black/40）
- **ImageCard 卡片圆角**：rounded-lg → rounded-2xl
- **ImageGrid 骨架屏**：SVG spinner → 磨砂玻璃卡片 + CSS border 旋转环
- **Toast**：新增状态图标（CheckCircle2 / XCircle / Info）+ 关闭按钮改 lucide X + 滑入动画
- **ToggleSwitch 开启态**：亮暗色统一 neutral-500（修复暗色模式白色轨道与白色小球对比度不足）
- **品牌色**：亮色模式 neutral-900 → neutral-700（按钮调浅更柔和）
- **全局 emoji → lucide-react**：Sidebar / ImageCard / Settings / 排序按钮 / 空状态 / Toast 全部替换为 SVG 图标
- **页面切换动画**：animate-page-in（opacity + translateY 150ms）
- **Toast 动画**：animate-toast-in（opacity + translateY 200ms）

### Fixed

- **MockProvider 测试 10% 概率失败**：用 `Math.random = mockFn` 注入确定性 stub，并新增一条强制失败路径测试覆盖错误消息（用例数 6 → 7）

### Dependencies

- 新增: `lucide-react ^1.16.0`（SVG 图标库，tree-shakable，替代 emoji）

---

## [dev1.3.1] - 2026-05-17

> Bug 修复批次 1：打包隔离 + 错误提示 + 排序同步 + 模型校验 + 删除实时刷新 — 0 个新文件，7 个修改文件

### Fixed

- **打包文件隔离**：`package.json` `build.files` 新增 `!config/**/*`、`!**/*.map` 排除规则，`config/local.json`（含 API Key）不再被打包进安装包
- **无 API Key 错误提示**：`handleGenerate` 两处错误文案由技术路径信息改为引导性操作提示（「请前往「API 配置」页面添加模型服务密钥」）
- **模型选择器初始顺序**：`ProviderSelector` 初始化时即读取 `loadOrder()` / `loadModelOrder()`，不再需要先打开 API 配置页才能同步排序；`activeProviderId` 为空时自动按用户排序选中第一个可用 Provider
- **阿里云未选模型拦截**：`generationStore.generate()` / `retryGenerate()` 新增前置校验，阿里云且 `activeModelId` 为空时直接报错不发起 API 请求；`ProviderSelector` 切换到阿里云时自动选中排序第一个模型
- **历史记录 / 收藏删除实时刷新**：`ImageCard` 新增 `onDelete` prop，`ImageGrid` 透传，`HistoryPage` / `FavoritesPage` 收到回调后立即从本地 state 移除，无需手动点刷新

---

## [dev1.3.0] - 2026-05-16

> 优化阶段 2：主题扩展 + 收藏 + 外观主题 + 壁纸删除 + 重构合并 — 6 个新文件，35 个修改文件

### Added

- **每日主题 3 组**：`promptEngine.buildDailyPrompts()` 每日随机 3 组独立主题并排展示，点击任一填充 Prompt
- **每日主题持久化**：生成后自动存 localStorage，90 天保留，`dailyTheme.getThemeHistory()` 按日期回溯
- **主题回顾 Tab**：侧边栏 📅 入口，按日期折叠展示历史每日主题，点击复用 Prompt
- **我的收藏 Tab**：侧边栏 ❤ 入口，展示所有点过"喜欢"的图像，复用 ImageGrid，空状态引导文案
- **外观主题**：设置页「暗夜模式 🌙」/「亮白模式 ☀」切换，Tailwind `darkMode: 'class'`，`useAppearance` hook 管理 `<html>` class
- **壁纸删除「不喜欢」**：ImageCard 新增 👎 按钮，弹出确认对话框（含"以后不再提示" checkbox），确认后清除记录 + 删除本地壁纸文件（`wallpaper:delete` IPC）
- **Like/Dislike 图标对称**：👍 喜欢 / 👍 已喜欢 + 👎 不喜欢
- **用户排序**：API 配置 + 模型服务列表支持 ↑↓ 排序，`providerOrder` 持久化到 localStorage，ProviderSelector 下拉同步顺序
- **模型排序**：API 配置页 DashScope 模型列表支持 ↑↓ 排序，`loadModelOrder`/`saveModelOrder` 持久化，ProviderSelector 模型下拉同步顺序
- **Mock 全链路闭环**：Mock 在 Electron 生成 IPC 中跳过 API Key/配置文件检查，直接返回占位图，无 config 也能测试
- **启动页**：`SplashScreen` 组件，首次启动展示 3s（镜头光圈 SVG + "拾光匣" + "每日一帧，拾起时光"），淡入淡出过渡，localStorage 标记控制
- **欢迎横幅**：每日抽卡页顶部 `WelcomeBanner`，显示「每日三组灵感主题，一键生成专属图像，设为壁纸，换种心情」+「开始今天的抽卡吧！」
- **首次使用引导**：首次进入每日抽卡页，展示样例主题卡片 +「开始今天的抽卡吧！」按钮，点击后生成真随机主题并自动选中，之后永不出现
- **提示词扩充**：风格 7→15 条，场景 6→15 条，构图 4→8 条，总组合 168→1,800
- **NSIS 卸载清理**：`build/installer.nsh` 自定义卸载脚本 + `deleteAppDataOnUninstall`，卸载时删除 `%APPDATA%/daycard-image/`、`Pictures/DayCard-Image/`、`%LOCALAPPDATA%/daycard-image/`

### Changed

- **Provider → "模型服务"**：全局用户可见文案替换（Sidebar、ProviderSelector、ProviderList、Onboarding、HistoryPage、ApiConfigPage、MockProvider、IPC 错误消息）
- **版本号**：Sidebar / Settings → dev1.3.0
- **菜单栏隐藏**：`Menu.setApplicationMenu(null)` 移除 Electron 顶部 File/Edit/View 菜单
- **模型服务合并入 API 配置**：移除侧边栏"模型服务"独立入口，API 配置卡片增加「切换」按钮，排序功能保留
- **ProviderSelector 去优先级**：下拉列表不再显示 P0/P1 标签
- **图标对称**：♡/❤ → 👍
- **`tailwind.config.js`**：ESM → CommonJS（修复 CJS 模式下 Tailwind 静默回退导致 dark: 变体不生成）
- **`generationStore`**：新增 `removeResult` action 支持实时移除
- **`useAppearance`**：渲染期间立即同步 DOM class + localStorage 兜底读写
- **App.tsx**：顶层调用 `useAppearance()` 覆盖 hydration/onboarding 阶段
- **夜间/亮白双主题**：20 个组件 className 改造，`bg-gray-N` → `bg-white/gray-50 dark:bg-gray-N` 等
- **Slogan**：「跨平台 AI 图像生成桌面应用」→「日更壁纸 · 拾光成匣」（package.json / README / 开发文档 / Settings 全局替换）
- **检查更新**：移除 electron-updater 完整状态机 → 点击弹出 info toast「暂不支持在线升级，请关注 GitHub Releases」
- **版本号**：`package.json` → `1.3.0-dev`（合法 semver），UI 仍显示 `dev1.3.0`

### Fixed

- **Tailwind dark: 变体不生成**：`tailwind.config.js` ESM 语法在 CJS 环境下被静默忽略 → 改为 `module.exports`
- **Web 模式主题切换无效**：`updateSetting` 依赖 Electron IPC → `handleAppearance` 直接操作 DOM + localStorage 兜底
- **排序保存失败**：`config:set-order` IPC 写 `config/local.json` 路径问题 → 改用 `localStorage('daycard-provider-order')`
- **Mock "未配置 API Key"**：生成 IPC 对 mock 无豁免 → `handleGenerate` 中 mock 提前返回，跳过 config 检查
- **Mock 在 API 配置不可见**：`PROVIDER_LABELS` 缺失 mock → 新增，展开后显示"无需配置"说明
- **Mock 在模型服务标记不可用**：`ProviderList` 可用性检查无 mock 豁免 → 追加 `p.id === 'mock'` 强制可用
- **启动页不可见**：首次启动后 `firstLaunch = false` 导致跳过 → 新增 `SplashScreen` 组件 + localStorage `daycard-splash-shown` 标记控制，清除后即可重测
- **打包后 API 配置无反应**：`config/local.json` 在生产环境不存在 → `getConfigPath()` 分包判断 `app.isPackaged ? userData/config.json : config/local.json`
- **打包后 Mock 仍显示**：`PROVIDER_LABELS` 硬编码 mock → `import.meta.env.DEV` 条件展开，生产构建 tree-shake 掉
- **配额显示 ∞**：QuotaBar 优先读前端 Provider 硬编码值 → Electron 环境优先走 `quota:get`/`quota:get-model` IPC
- **每日主题不更新**：`date.toISOString()` 取 UTC 时间，中国时区 8AM 前日期滞后 → 改为 `getFullYear/getMonth/getDate` 本地时间
- **electron-builder 版本报错**：`"version": "dev1.3.0"` 非合法 semver → `"1.3.0-dev"`
- **electron-builder winCodeSign 解压失败**：Windows 无法创建 macOS 符号链接 → 清缓存 + `signAndEditExecutable: false`

### Dependencies

- 移除: `electron-store`（已替换为 `electron/storage.ts` JSON 文件读写）

---

## [1.2.1] - 2026-05-16

> 优化阶段 1：API 配置 + DashScope 集成 + 壁纸修复 + 持久化修复 — 4 个新文件，23 个修改文件

### Added

- **API 配置页面**：侧边栏 🔑 入口，查看/编辑各 Provider API Key（脱敏显示），测试连接，一键导入默认模型
- **DashScope 8 模型集成**：替换旧版 Aliyun 异步轮询 API 为 multimodal 同步 API（`services/aigc/multimodal-generation/generation`）
- **模型级配额**：QuotaService 扩展模型级追踪，每模型独立 remaining，生成后自动回写 config
- **ProviderSelector 二级选择**：选中 DashScope 时显示模型下拉（模型名 + 描述 + 剩余配额）
- **配置 IPC**：`config:get`（脱敏）/ `config:set` / `config:test`（连接探活）
- **双重结果持久化**：主进程文件备份（`userData/results.json`）+ localStorage；启动优先从主进程加载
- **结果 IPC**：`results:load` / `results:save`

### Changed

- `generationStore`：新增 `activeModelId` + `setActiveModel`；生成路径统一（Electron → IPC，Web → ProviderManager）；异步加载结果
- `persistenceStore`：新增 `loadAsync` 从主进程加载，`save` 双写（localStorage + IPC）
- `ProviderList/ProviderSelector`：Electron 模式从 config 判断可用性（不用 HTTP 探活）
- `bootstrap.ts`：所有环境注册真实 Provider（供 UI 展示，实际生图走 IPC）
- `WallpaperService`：图片直接存归档目录（不再临时文件）；去掉 `failOn: 'none'`；文件校验 ≥ 1KB；PowerShell 脚本写入临时 `.ps1` 文件执行
- `ImageValidator`：去掉 HEAD 预检，直接 GET 下载；尺寸阈值 256→128px；格式解析失败时宽松放行
- `NetworkService`：探活 URL 从 Google → DashScope（国内可达）
- `ImageCard`："保存" → "另存为"
- `Sidebar`：版本号 v1.1.0 → v1.2.0

### Fixed

- **历史记录重启消失**：localStorage 单点故障 → 主进程 `results.json` 文件备份 + 启动优先加载
- **壁纸设置黑屏/纯色**：PowerShell here-string 压缩+嵌套引号 → 写 `.ps1` 临时文件；路径双重转义 → 直接传原始路径；SPI flag 2→3
- **Provider 全部不可用**：空 API Key 下 HTTP 探活失败 → Electron 模式检查 config hasKey
- **API 配置页不显示/无模型**：`getConfig` 返回结构不一致 → 统一 `{providers: {...}}` 包装
- **一直显示离线**：Google 探活被墙 → DashScope API 探活
- **图片校验阻断生成**：HEAD 请求 CDN 不支持 → 直接 GET；sharp 格式异常 → 宽松放行
- **开关溢出/状态不一致**：乐观更新 + 尺寸过小 → 等 IPC 返回 + 加大尺寸 + overflow-hidden

---

## [1.2.0] - 2026-05-16

> 阶段 5：质量强化 — 12 个新文件，12 个修改文件

### Added

- **配额持久化**：`QuotaService` 使用 JSON 文件存储（`userData/quota.json`），分 Provider 按日记录，支持历史查询
- **配额硬限制拦截**：`canGenerate()` 前置校验，当日额度耗尽直接拦截并提示重置时间，不触发 API 调用；QuotaBar 变红 + "已耗尽" 标签
- **Prompt 三维词库**：`src/prompts/` 风格 (7) × 场景 (6) × 构图 (4) JSON 词库，`promptEngine.ts` 基于日期 seed 确定性随机抽取
- **用户偏好标签**：ImageCard 新增 ❤ 「喜欢」按钮，词条权重 +1，下次加权随机抽取；偏好数据持久化到 `userData/preferences.json`
- **离线检测**：`NetworkService` 定期 HEAD 探活（30s），`useNetworkStatus` hook 双监听（browser events + IPC），离线时显示 OfflineBanner + 禁用生成
- **图像质量校验**：`ImageValidator` 校验 URL 可访问性 + Content-Type + 尺寸 ≥ 256px，失败自动重试最多 2 次
- **electron-updater 自动更新**：启动后 5s 静默检查 GitHub Releases，设置页支持手动检查、下载、安装更新；`app.isPackaged` 守卫开发模式

### Changed

- `electron/ipc/imageGeneration.ts`：移除内存 `quotaTracker` Map，改用 `QuotaService`；集成 `ImageValidator` 校验+重试循环
- `electron/ipc/quota.ts`：独立配额 IPC 模块（`quota:get` / `quota:history` / `quota:all`）
- `electron/storage.ts`：通用 JSON 文件存储模块，替代 `electron-store` 依赖
- `electron/services/SettingsService.ts`：迁移至 `storage.ts`
- `src/utils/dailyTheme.ts`：调用 `promptEngine.buildDailyPrompt()`，Theme name 变为 "风格 × 场景"
- `QuotaBar.tsx`：修正颜色逻辑（高用量→红色），耗尽时红色警示
- `PromptInput.tsx`：配额耗尽/离线时禁用按钮 + tooltip 提示
- `ImageCard.tsx`：新增 Like 按钮
- `Settings.tsx`：显示 v1.2.0 版本号 + 检查更新按钮 + 更新状态管理
- `App.tsx`：集成 `useNetworkStatus`，离线时展示 OfflineBanner
- `main.ts`：初始化 QuotaService/NetworkService/UpdateService；修复 `app.isPackaged` 替代 `NODE_ENV`
- `tsconfig.electron.json`：保持 CommonJS 输出

### Fixed

- electron-store v11 ESM-only 类型冲突 → 替换为 `electron/storage.ts` JSON 文件读写
- `quota:get` IPC 重复注册 → 删除 main.ts 中旧 inline handler
- 开发模式 Electron 加载 dist/index.html → 改用 `app.isPackaged` 判断
- `SettingsService.reset()` 类型错误 → `as any` 类型断言
- `SchedulerService` `cron.ScheduledTask` 类型缺失 → 安装 `@types/node-cron`

### Dependencies

- 新增: `electron-updater ^6.8.3`, `@types/node-cron`
- 移除: `electron-store`（替换为 `electron/storage.ts`）

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

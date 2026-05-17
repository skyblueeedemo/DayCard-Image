/**
 * 路由表 — 单一事实来源
 *
 * 设计目标：
 * 1. 把 App.tsx 字符串联合类型 + Sidebar.tsx navItems 硬编码合并到此
 * 2. 新增页面只需在此追加一条记录，App + Sidebar 自动同步
 * 3. 不引入 react-router（单页应用复杂度不需要）
 *
 * 扩展点：
 * - icon 字段当前为 emoji（与现有 Sidebar 行为一致），
 *   阶段三 UI 升级时可改为 lucide-react SVG 组件引用
 */

export const ROUTE_DEFINITIONS = [
  { id: 'daily', label: '今日抽卡', icon: '🎴' },
  { id: 'favorites', label: '我的收藏', icon: '❤' },
  { id: 'history', label: '历史记录', icon: '📁' },
  { id: 'theme-history', label: '主题回顾', icon: '📅' },
  { id: 'api-config', label: 'API 配置', icon: '🔑' },
  { id: 'settings', label: '设置', icon: '🔧' },
] as const;

export type RouteId = typeof ROUTE_DEFINITIONS[number]['id'];

export interface RouteMeta {
  id: RouteId;
  label: string;
  icon: string;
}

export const ROUTES: readonly RouteMeta[] = ROUTE_DEFINITIONS;

/**
 * 所有有效 RouteId 的集合（用于运行时校验，例如托盘 navigate-to 事件）
 */
export const ROUTE_IDS: readonly RouteId[] = ROUTE_DEFINITIONS.map((r) => r.id);

/**
 * 类型守卫：判断字符串是否为有效 RouteId
 */
export function isRouteId(value: string): value is RouteId {
  return (ROUTE_IDS as readonly string[]).includes(value);
}

/**
 * 默认起始路由
 */
export const DEFAULT_ROUTE: RouteId = 'daily';

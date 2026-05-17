/**
 * 路由表 — 单一事实来源
 *
 * 设计目标：
 * 1. 把 App.tsx 字符串联合类型 + Sidebar.tsx navItems 硬编码合并到此
 * 2. 新增页面只需在此追加一条记录，App + Sidebar 自动同步
 * 3. 不引入 react-router（单页应用复杂度不需要）
 *
 * 阶段三 子阶段 3-B：icon 字段从 emoji 字符串迁移为 lucide-react 组件
 */

import {
  Sparkles,
  Heart,
  FolderOpen,
  CalendarDays,
  KeyRound,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';

export const ROUTE_DEFINITIONS = [
  { id: 'daily', label: '今日抽卡', icon: Sparkles },
  { id: 'favorites', label: '我的收藏', icon: Heart },
  { id: 'history', label: '历史记录', icon: FolderOpen },
  { id: 'theme-history', label: '主题回顾', icon: CalendarDays },
  { id: 'api-config', label: 'API 配置', icon: KeyRound },
  { id: 'settings', label: '设置', icon: SettingsIcon },
] as const;

export type RouteId = typeof ROUTE_DEFINITIONS[number]['id'];

export interface RouteMeta {
  id: RouteId;
  label: string;
  icon: LucideIcon;
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

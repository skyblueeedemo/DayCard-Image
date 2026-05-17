import { useEffect } from 'react';
import { useGenerationStore } from '@/store/generationStore';
import { ROUTE_DEFINITIONS, type RouteId } from '@/router/routes';

/**
 * 全局键盘快捷键
 *
 * 已支持：
 * - Ctrl/Cmd + Enter：触发生成（与 PromptInput 行为一致）
 * - Escape：关闭错误提示
 * - Ctrl/Cmd + ,：跳转到设置页（dispatch 自定义事件，App.tsx 监听）
 * - Ctrl/Cmd + 1~6：按 ROUTES 顺序切换页面
 *
 * 未支持（明确决策不做）：
 * - Space：与输入框冲突
 *
 * 路由跳转通过 window 自定义事件 'daycard:navigate' 解耦，
 * App.tsx 监听该事件并 setActivePage（避免 hook 直接持有路由 setter）。
 */

export const NAVIGATE_EVENT = 'daycard:navigate';

export interface NavigateEventDetail {
  page: RouteId;
}

function dispatchNavigate(page: RouteId): void {
  window.dispatchEvent(new CustomEvent<NavigateEventDetail>(NAVIGATE_EVENT, { detail: { page } }));
}

export function useKeyboardShortcuts() {
  const generate = useGenerationStore((s) => s.generate);
  const clearError = useGenerationStore((s) => s.clearError);
  const error = useGenerationStore((s) => s.error);
  const prompt = useGenerationStore((s) => s.prompt);
  const isGenerating = useGenerationStore((s) => s.isGenerating);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + Enter：生成
      if (mod && e.key === 'Enter') {
        e.preventDefault();
        if (prompt.trim() && !isGenerating) {
          generate();
        }
        return;
      }

      // Ctrl/Cmd + ,：跳转设置
      if (mod && e.key === ',') {
        e.preventDefault();
        dispatchNavigate('settings');
        return;
      }

      // Ctrl/Cmd + 1~6：按 ROUTES 顺序切换页面
      if (mod && /^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const route = ROUTE_DEFINITIONS[idx];
        if (route) {
          e.preventDefault();
          dispatchNavigate(route.id);
        }
        return;
      }

      // Escape：关闭错误提示
      if (e.key === 'Escape' && error) {
        e.preventDefault();
        clearError();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generate, clearError, error, prompt, isGenerating]);
}

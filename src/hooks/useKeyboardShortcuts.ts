import { useEffect } from 'react';
import { useGenerationStore } from '@/store/generationStore';

export function useKeyboardShortcuts() {
  const generate = useGenerationStore((s) => s.generate);
  const clearError = useGenerationStore((s) => s.clearError);
  const error = useGenerationStore((s) => s.error);
  const prompt = useGenerationStore((s) => s.prompt);
  const isGenerating = useGenerationStore((s) => s.isGenerating);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + Enter: 生成
      if (mod && e.key === 'Enter') {
        e.preventDefault();
        if (prompt.trim() && !isGenerating) {
          generate();
        }
        return;
      }

      // Escape: 关闭错误提示
      if (e.key === 'Escape' && error) {
        e.preventDefault();
        clearError();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generate, clearError, error, prompt, isGenerating]);
}

import { useGenerationStore } from '@/store/generationStore';

interface PromptInputProps {
  isOnline?: boolean;
}

export default function PromptInput({ isOnline = true }: PromptInputProps) {
  const prompt = useGenerationStore((s) => s.prompt);
  const isGenerating = useGenerationStore((s) => s.isGenerating);
  const error = useGenerationStore((s) => s.error);
  const setPrompt = useGenerationStore((s) => s.setPrompt);
  const generate = useGenerationStore((s) => s.generate);
  const clearError = useGenerationStore((s) => s.clearError);

  const quotaExhausted = error?.includes('额度已用尽');

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating || quotaExhausted || !isOnline) return;
    generate();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col gap-3">
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-300 text-sm">
          <span className="flex-1">{error}</span>
          <button
            onClick={clearError}
            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-200 text-lg leading-none"
            aria-label="关闭错误提示"
          >
            &times;
          </button>
        </div>
      )}

      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="描述你想要的图像... (Enter 发送，Shift+Enter 换行)"
          disabled={isGenerating || !isOnline}
          rows={3}
          maxLength={500}
          className="w-full resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        />

        <div className="absolute bottom-3 right-3 flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-500">{prompt.length}/500</span>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isGenerating || quotaExhausted || !isOnline}
            title={!isOnline ? '离线状态无法生成' : quotaExhausted ? (error ?? undefined) : undefined}
            className="px-4 py-1.5 rounded-md bg-blue-600 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isGenerating && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isGenerating ? '生成中...' : !isOnline ? '离线中' : quotaExhausted ? '额度已用完' : '生成'}
          </button>
        </div>
      </div>
    </div>
  );
}

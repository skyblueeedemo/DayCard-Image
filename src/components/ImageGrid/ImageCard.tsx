import { useState } from 'react';
import type { ImageResult } from '@/providers/IImageProvider';
import { useGenerationStore } from '@/store/generationStore';

interface ImageCardProps {
  result: ImageResult;
}

const providerColors: Record<string, string> = {
  mock: 'bg-purple-700 text-purple-200',
  openai: 'bg-green-700 text-green-200',
  stability: 'bg-yellow-700 text-yellow-200',
  zhipu: 'bg-blue-700 text-blue-200',
  aliyun: 'bg-orange-700 text-orange-200',
};

export default function ImageCard({ result }: ImageCardProps) {
  const retryGenerate = useGenerationStore((s) => s.retryGenerate);
  const isGenerating = useGenerationStore((s) => s.isGenerating);
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const badgeClass = providerColors[result.provider] ?? 'bg-gray-700 text-gray-200';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(result.url).catch(() => {});
    showToast('URL 已复制');
  };

  const handleSave = async () => {
    // Electron 环境：使用原生保存对话框
    if (window.electronAPI?.saveImage) {
      setSaving(true);
      try {
        const res = await window.electronAPI.saveImage({
          imageUrl: result.url,
          defaultName: `daycard-${result.provider}-${Date.now()}.png`,
        });
        if (res.status === 'ok') {
          showToast('已保存到本地');
        } else if (res.status !== 'cancelled') {
          showToast(res.message ?? '保存失败');
        }
      } catch {
        showToast('保存失败');
      } finally {
        setSaving(false);
      }
    } else {
      // 非 Electron 环境：降级为复制 URL
      handleCopyUrl();
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retryGenerate(result.metadata.prompt);
      showToast('已重新生成');
    } catch {
      // error 由 store 处理
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="relative rounded-lg border border-gray-700 bg-gray-800 overflow-hidden hover:border-gray-600 transition-colors">
      {/* Toast */}
      {toast && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded bg-gray-900/90 text-xs text-gray-200 shadow-lg">
          {toast}
        </div>
      )}

      <div className="aspect-square bg-gray-900">
        <img
          src={result.url}
          alt={result.metadata.prompt}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" fill="%23374151"><rect width="400" height="400"/><text x="200" y="210" text-anchor="middle" fill="%239ca3af" font-size="14">Load Failed</text></svg>';
          }}
        />
      </div>

      <div className="p-3 flex flex-col gap-2">
        <p className="text-xs text-gray-400 line-clamp-2" title={result.metadata.prompt}>
          {result.metadata.prompt}
        </p>

        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-0.5 rounded-full ${badgeClass}`}>
            {result.provider}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(result.metadata.generatedAt).toLocaleTimeString()}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || isGenerating}
            className="flex-1 text-xs py-1.5 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {saving ? '保存中...' : window.electronAPI?.saveImage ? '保存' : '复制 URL'}
          </button>
          <button
            onClick={handleRetry}
            disabled={retrying || isGenerating}
            className="flex-1 text-xs py-1.5 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
          >
            {retrying && (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {retrying ? '...' : '重新生成'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import type { ImageResult } from '@/providers/IImageProvider';
import { useGenerationStore } from '@/store/generationStore';
import { useWallpaper } from '@/hooks/useWallpaper';
import { persistenceStore } from '@/store/persistenceStore';
import { storageAdapter } from '@/store/storageAdapter';
import { buildDailyPrompt } from '@/utils/promptEngine';

interface ImageCardProps {
  result: ImageResult;
  onDelete?: (result: ImageResult) => void;
}

const providerColors: Record<string, string> = {
  mock: 'bg-purple-700 text-purple-200',
  openai: 'bg-green-700 text-green-200',
  stability: 'bg-yellow-700 text-yellow-200',
  zhipu: 'bg-fg-secondary text-surface-0',
  aliyun: 'bg-orange-700 text-orange-200',
};

const SKIP_CONFIRM_KEY = 'daycard-skip-delete-confirm';

function shouldSkipConfirm(): boolean {
  return storageAdapter.getString(SKIP_CONFIRM_KEY, '') === 'true';
}

function setSkipConfirm(skip: boolean): void {
  storageAdapter.setString(SKIP_CONFIRM_KEY, String(skip));
}

export default function ImageCard({ result, onDelete }: ImageCardProps) {
  const retryGenerate = useGenerationStore((s) => s.retryGenerate);
  const removeResult = useGenerationStore((s) => s.removeResult);
  const isGenerating = useGenerationStore((s) => s.isGenerating);
  const { setAsWallpaper, isSetting } = useWallpaper();
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [skipNext, setSkipNext] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const genDate = new Date(result.metadata.generatedAt);
  const dailyPrompt = buildDailyPrompt(genDate);

  useEffect(() => {
    if (window.electronAPI?.getLikedResults) {
      window.electronAPI.getLikedResults().then((res) => {
        if (res.status === 'ok' && res.data?.includes(result.url)) {
          setLiked(true);
        }
      }).catch(() => {});
    }
  }, [result.url]);

  const handleLikeToggle = async () => {
    if (!window.electronAPI?.likePrompt || !window.electronAPI?.unlikePrompt) return;
    setLikeLoading(true);
    try {
      const params = {
        imageUrl: result.url,
        styleId: dailyPrompt.style.id,
        sceneId: dailyPrompt.scene.id,
        compositionId: dailyPrompt.composition.id,
      };

      if (liked) {
        const res = await window.electronAPI.unlikePrompt(params);
        if (res.status === 'ok') setLiked(false);
      } else {
        const res = await window.electronAPI.likePrompt(params);
        if (res.status === 'ok') setLiked(true);
      }
    } catch {
      // 静默失败
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDislike = () => {
    if (shouldSkipConfirm()) {
      executeDelete();
    } else {
      setShowDeleteDialog(true);
    }
  };

  const executeDelete = async () => {
    setDeleting(true);
    try {
      // 取消喜欢（如果已喜欢）
      if (liked && window.electronAPI?.unlikePrompt) {
        await window.electronAPI.unlikePrompt({
          imageUrl: result.url,
          styleId: dailyPrompt.style.id,
          sceneId: dailyPrompt.scene.id,
          compositionId: dailyPrompt.composition.id,
        });
      }

      // 删除本地壁纸文件
      const dateStr = `${genDate.getFullYear()}-${String(genDate.getMonth() + 1).padStart(2, '0')}-${String(genDate.getDate()).padStart(2, '0')}`;
      if (window.electronAPI?.deleteWallpaper) {
        await window.electronAPI.deleteWallpaper({ dateStr }).catch(() => {});
      }

      // 从 persistenceStore 中移除
      const all = persistenceStore.load();
      const filtered = all.filter((r) => r.url !== result.url && r.metadata.generatedAt !== result.metadata.generatedAt);
      persistenceStore.save(filtered);

      // 从 generationStore 中移除（实时刷新 ImageGrid）
      removeResult(result);

      // 通知父组件（历史页/收藏页）实时更新列表
      onDelete?.(result);

      showToast('已删除');
    } catch {
      showToast('删除失败');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const confirmDelete = () => {
    if (skipNext) {
      setSkipConfirm(true);
    }
    executeDelete();
  };

  const badgeClass = providerColors[result.provider] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(result.url).catch(() => {});
    showToast('URL 已复制');
  };

  const handleSave = async () => {
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
    <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      {/* Toast */}
      {toast && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded bg-gray-100 dark:bg-gray-900/90 text-xs text-gray-700 dark:text-gray-200 shadow-lg">
          {toast}
        </div>
      )}

      <div className="aspect-square bg-gray-100 dark:bg-gray-900">
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
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2" title={result.metadata.prompt}>
          {result.metadata.prompt}
        </p>

        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-0.5 rounded-full ${badgeClass}`}>
            {result.provider}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(result.metadata.generatedAt).toLocaleTimeString()}
          </span>
        </div>

        {/* Like / Dislike 按钮 */}
        {window.electronAPI && (
          <div className="flex gap-2">
            <button
              onClick={handleLikeToggle}
              disabled={likeLoading}
              className={`flex-1 text-xs py-1 px-2 rounded transition-colors flex items-center justify-center gap-1 ${
                liked
                  ? 'bg-brand/10 dark:bg-brand/20 text-brand border border-brand/30 dark:border-brand/40'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-transparent hover:border-gray-300 dark:hover:border-gray-500'
              }`}
              title={liked ? '取消喜欢' : '喜欢'}
            >
              {liked ? '已喜欢' : '喜欢'}
              <ThumbsUp size={14} strokeWidth={1.75} className={liked ? 'fill-current' : ''} />
            </button>
            <button
              onClick={handleDislike}
              disabled={deleting}
              className="flex-1 text-xs py-1 px-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-transparent hover:border-gray-300 dark:hover:border-gray-500 transition-colors flex items-center justify-center gap-1"
              title="不喜欢，删除此图像"
            >
              不喜欢
              <ThumbsDown size={14} strokeWidth={1.75} />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || isGenerating}
            className="flex-1 text-xs py-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {saving ? '保存中...' : window.electronAPI?.saveImage ? '另存为' : '复制 URL'}
          </button>
          <button
            onClick={handleRetry}
            disabled={retrying || isGenerating}
            className="flex-1 text-xs py-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
          >
            {retrying && (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {retrying ? '...' : '重新生成'}
          </button>
          {window.electronAPI && (
            <button
              onClick={() => setAsWallpaper(result.url)}
              disabled={isSetting || isGenerating}
              className="flex-1 text-xs py-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              {isSetting ? '设置中...' : '设为壁纸'}
            </button>
          )}
        </div>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDeleteDialog(false)}>
          <div
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-96 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">确认删除</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">确定要删除这张图像吗？此操作不可撤销。</p>

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={skipNext}
                onChange={(e) => setSkipNext(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-brand focus:ring-0"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">以后不再提示</span>
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="text-xs px-4 py-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="text-xs px-4 py-1.5 rounded bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

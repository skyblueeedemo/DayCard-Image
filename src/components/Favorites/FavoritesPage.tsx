import { useState, useEffect, useCallback } from 'react';
import type { ImageResult } from '@/providers/IImageProvider';
import { persistenceStore } from '@/store/persistenceStore';
import ImageGrid from '@/components/ImageGrid/ImageGrid';

export default function FavoritesPage() {
  const [likedResults, setLikedResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let likedUrls: string[] = [];

      if (window.electronAPI?.getLikedResults) {
        const res = await window.electronAPI.getLikedResults();
        if (res.status === 'ok' && Array.isArray(res.data)) {
          likedUrls = res.data;
        }
      }

      const allResults = persistenceStore.load();
      const filtered = allResults.filter((r) => likedUrls.includes(r.url));
      setLikedResults(filtered);
    } catch {
      setLikedResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = useCallback((deleted: ImageResult) => {
    setLikedResults((prev) =>
      prev.filter(
        (r) => r.url !== deleted.url || r.metadata.generatedAt !== deleted.metadata.generatedAt,
      ),
    );
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-4xl flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">我的收藏</h2>
        <button
          onClick={refresh}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          刷新
        </button>
      </div>

      <ImageGrid
        results={likedResults}
        loading={false}
        emptyMessage="还没有喜欢的图片"
        emptyHint="去生成一张并点击 👍 收藏吧"
        onDelete={handleDelete}
      />
    </div>
  );
}

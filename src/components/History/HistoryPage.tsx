import { useState, useMemo, useCallback } from 'react';
import type { ImageResult } from '@/providers/IImageProvider';
import { persistenceStore } from '@/store/persistenceStore';
import ImageGrid from '@/components/ImageGrid/ImageGrid';

export default function HistoryPage() {
  const [results, setResults] = useState<ImageResult[]>(() => persistenceStore.load());
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [sortNewest, setSortNewest] = useState(true);

  const providers = useMemo(() => {
    const ids = new Set(results.map((r) => r.provider));
    return Array.from(ids);
  }, [results]);

  const filtered = useMemo(() => {
    let list = [...results];
    if (filterProvider !== 'all') {
      list = list.filter((r) => r.provider === filterProvider);
    }
    list.sort((a, b) => {
      const da = new Date(a.metadata.generatedAt).getTime();
      const db = new Date(b.metadata.generatedAt).getTime();
      return sortNewest ? db - da : da - db;
    });
    return list;
  }, [results, filterProvider, sortNewest]);

  const refresh = () => {
    setResults(persistenceStore.load());
  };

  const handleDelete = useCallback((deleted: ImageResult) => {
    setResults((prev) =>
      prev.filter(
        (r) => r.url !== deleted.url || r.metadata.generatedAt !== deleted.metadata.generatedAt,
      ),
    );
  }, []);

  const btnStyle = "text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors";

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-4xl flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">历史记录</h2>

        <div className="flex items-center gap-3">
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-600 dark:text-gray-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">全部模型服务</option>
            {providers.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>

          <button onClick={() => setSortNewest(!sortNewest)} className={btnStyle}>
            {sortNewest ? '最新优先' : '最早优先'}
          </button>

          <button onClick={refresh} className={btnStyle}>
            刷新
          </button>
        </div>
      </div>

      <ImageGrid
        results={filtered}
        loading={false}
        emptyMessage="暂无历史记录"
        emptyHint="生成图像后将自动保存在这里"
        onDelete={handleDelete}
      />
    </div>
  );
}

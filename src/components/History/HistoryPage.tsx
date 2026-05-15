import { useState, useMemo } from 'react';
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

  // 每次切换到历史页面时刷新数据
  const refresh = () => {
    setResults(persistenceStore.load());
  };

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-full max-w-4xl flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">历史记录</h2>

        <div className="flex items-center gap-3">
          {/* Provider 筛选 */}
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="text-sm rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-gray-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">全部 Provider</option>
            {providers.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>

          {/* 排序 */}
          <button
            onClick={() => setSortNewest(!sortNewest)}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 transition-colors"
          >
            {sortNewest ? '最新优先' : '最早优先'}
          </button>

          {/* 刷新 */}
          <button
            onClick={refresh}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 transition-colors"
          >
            刷新
          </button>
        </div>
      </div>

      <ImageGrid
        results={filtered}
        loading={false}
        emptyMessage="暂无历史记录"
        emptyHint="生成图像后将自动保存在这里"
      />
    </div>
  );
}

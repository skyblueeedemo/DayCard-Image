import type { ImageResult } from '@/providers/IImageProvider';
import { useGenerationStore } from '@/store/generationStore';
import ImageCard from './ImageCard';

interface ImageGridProps {
  results?: ImageResult[];
  loading?: boolean;
  emptyMessage?: string;
  emptyHint?: string;
}

export default function ImageGrid({
  results: externalResults,
  loading: externalLoading,
  emptyMessage = '尚未生成任何图像',
  emptyHint = '输入 Prompt 开始创作',
}: ImageGridProps) {
  const storeResults = useGenerationStore((s) => s.results);
  const storeLoading = useGenerationStore((s) => s.isGenerating);

  const results = externalResults ?? storeResults;
  const isLoading = externalLoading ?? storeLoading;

  if (results.length === 0 && !isLoading) {
    return (
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
            <span className="text-5xl mb-4">🖼</span>
            <p className="text-sm">{emptyMessage}</p>
            <p className="text-xs mt-1 text-gray-600">{emptyHint}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && (
          <div className="aspect-square rounded-lg border border-gray-700 bg-gray-800 animate-pulse flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-400">生成中...</span>
            </div>
          </div>
        )}
        {results.map((result, index) => (
          <ImageCard key={`${result.metadata.generatedAt}-${index}`} result={result} />
        ))}
      </div>
    </div>
  );
}

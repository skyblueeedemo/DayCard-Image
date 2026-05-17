import { ImageIcon } from 'lucide-react';
import type { ImageResult } from '@/providers/IImageProvider';
import { useGenerationStore } from '@/store/generationStore';
import ImageCard from './ImageCard';

interface ImageGridProps {
  results?: ImageResult[];
  loading?: boolean;
  emptyMessage?: string;
  emptyHint?: string;
  onDelete?: (result: ImageResult) => void;
}

export default function ImageGrid({
  results: externalResults,
  loading: externalLoading,
  emptyMessage = '尚未生成任何图像',
  emptyHint = '输入 Prompt 开始创作',
  onDelete,
}: ImageGridProps) {
  const storeResults = useGenerationStore((s) => s.results);
  const storeLoading = useGenerationStore((s) => s.isGenerating);

  const results = externalResults ?? storeResults;
  const isLoading = externalLoading ?? storeLoading;

  if (results.length === 0 && !isLoading) {
    return (
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-fg-muted">
            <ImageIcon size={48} strokeWidth={1.25} className="mb-4" />
            <p className="text-sm">{emptyMessage}</p>
            <p className="text-xs mt-1 text-fg-muted">{emptyHint}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && (
          <div className="aspect-square rounded-2xl border border-border-default bg-surface-2/50 backdrop-blur-sm animate-pulse flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
              <span className="text-sm text-fg-muted">生成中...</span>
            </div>
          </div>
        )}
        {results.map((result, index) => (
          <ImageCard key={`${result.metadata.generatedAt}-${index}`} result={result} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

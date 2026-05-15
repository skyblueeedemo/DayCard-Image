import type { ImageResult } from '@/providers/IImageProvider';

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
  const badgeClass = providerColors[result.provider] ?? 'bg-gray-700 text-gray-200';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(result.url).catch(() => {});
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 overflow-hidden hover:border-gray-600 transition-colors">
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
            onClick={handleCopyUrl}
            className="flex-1 text-xs py-1.5 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          >
            Copy URL
          </button>
        </div>
      </div>
    </div>
  );
}

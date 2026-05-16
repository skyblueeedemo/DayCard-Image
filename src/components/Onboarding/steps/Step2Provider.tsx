interface Step2ProviderProps {
  selected: string;
  onChange: (providerId: string) => void;
  configuredProviders: { id: string; name: string }[];
}

const PROVIDER_INFO: Record<string, string> = {
  openai: 'GPT-image-2 / DALL·E 3 — 每日免费 5 张',
  stability: 'Stability AI — 低成本按量计费',
  zhipu: '智谱 CogView — 中文 Prompt 友好',
  aliyun: '阿里云通义万象 — 企业级生产备用',
};

export type { Step2ProviderProps };

export default function Step2Provider({ selected, onChange, configuredProviders }: Step2ProviderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-white mb-2">选择首选 Provider</h2>
        <p className="text-sm text-gray-400">选择默认使用的图像生成服务，可随时在设置中更改</p>
      </div>

      <div className="flex flex-col gap-2">
        {configuredProviders.map(({ id, name }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`text-left p-3 rounded-lg border transition-colors ${
              selected === id
                ? 'border-blue-500 bg-blue-900/30'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <div className="text-sm font-medium text-white">{name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{PROVIDER_INFO[id] ?? ''}</div>
          </button>
        ))}

        {configuredProviders.length === 0 && (
          <p className="text-sm text-gray-500 text-center">请先在步骤 1 中至少配置一个 API Key</p>
        )}
      </div>
    </div>
  );
}

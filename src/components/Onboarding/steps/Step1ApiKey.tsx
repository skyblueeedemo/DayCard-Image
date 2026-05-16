interface FormData {
  openaiKey: string;
  stabilityKey: string;
  zhipuKey: string;
  aliyunKey: string;
}

interface Step1ApiKeyProps {
  formData: FormData;
  onChange: (data: FormData) => void;
}

const PROVIDER_FIELDS: { key: keyof FormData; label: string; placeholder: string }[] = [
  { key: 'openaiKey', label: 'OpenAI', placeholder: 'sk-...' },
  { key: 'stabilityKey', label: 'Stability AI', placeholder: 'sk-...' },
  { key: 'zhipuKey', label: '智谱 CogView', placeholder: '输入 API Key' },
  { key: 'aliyunKey', label: '阿里云通义万象', placeholder: '输入 API Key' },
];

export type { FormData as Step1Data };

export default function Step1ApiKey({ formData, onChange }: Step1ApiKeyProps) {
  const hasAnyKey = Object.values(formData).some((v) => v.trim().length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center mb-2">
        <h1 className="text-xl font-bold text-white mb-2">欢迎使用拾光匣</h1>
        <p className="text-sm text-gray-400">请至少配置一个 API Key 以开始使用</p>
      </div>

      <div className="flex flex-col gap-3">
        {PROVIDER_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">{label}</label>
            <input
              type="password"
              value={formData[key]}
              onChange={(e) => onChange({ ...formData, [key]: e.target.value })}
              placeholder={placeholder}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        ))}
      </div>

      {!hasAnyKey && (
        <p className="text-xs text-gray-500 text-center">
          也可以跳过，稍后在设置中配置
        </p>
      )}
    </div>
  );
}

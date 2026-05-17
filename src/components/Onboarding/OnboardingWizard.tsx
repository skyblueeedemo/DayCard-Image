import { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import Step1ApiKey from './steps/Step1ApiKey';
import Step2Provider from './steps/Step2Provider';
import Step3Prefs from './steps/Step3Prefs';

const PROVIDER_NAMES: Record<string, string> = {
  openai: 'OpenAI (GPT-image-2)',
  stability: 'Stability AI',
  zhipu: '智谱 CogView',
  aliyun: '阿里云通义万象',
};

export default function OnboardingWizard() {
  const { setFirstLaunchComplete, updateSetting } = useSettingsStore();

  const [step, setStep] = useState(1);
  const [apiKeys, setApiKeys] = useState({
    openaiKey: '',
    stabilityKey: '',
    zhipuKey: '',
    aliyunKey: '',
  });
  const [selectedProvider, setSelectedProvider] = useState('');
  const [prefs, setPrefs] = useState({
    autoLaunch: false,
    schedulerEnabled: false,
    schedulerTime: '08:00',
  });

  const configuredProviders = Object.entries(apiKeys)
    .filter(([, v]) => v.trim().length > 0)
    .map(([key]) => {
      const id = key.replace('Key', '');
      return { id, name: PROVIDER_NAMES[id] ?? id };
    });

  const handleNext = () => {
    if (step === 1 && configuredProviders.length > 0 && !selectedProvider) {
      setSelectedProvider(configuredProviders[0].id);
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleComplete = async () => {
    await updateSetting('preferredProvider', selectedProvider);
    await updateSetting('autoLaunch', prefs.autoLaunch);
    await updateSetting('schedulerEnabled', prefs.schedulerEnabled);
    await updateSetting('schedulerTime', prefs.schedulerTime);
    await setFirstLaunchComplete();
  };

  const handleSkip = async () => {
    await setFirstLaunchComplete();
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-gray-950">
      <div className="w-full max-w-md mx-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl">
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === step ? 'bg-brand' : i < step ? 'bg-brand/60' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[280px]">
            {step === 1 && (
              <Step1ApiKey formData={apiKeys} onChange={setApiKeys} />
            )}
            {step === 2 && (
              <Step2Provider
                selected={selectedProvider}
                onChange={setSelectedProvider}
                configuredProviders={configuredProviders}
              />
            )}
            {step === 3 && (
              <Step3Prefs data={prefs} onChange={setPrefs} />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleSkip}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              跳过引导
            </button>

            <div className="flex gap-2">
              {step > 1 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 text-sm rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  上一步
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 text-sm rounded bg-brand text-brand-fg hover:bg-brand-hover transition-colors"
                >
                  下一步
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-4 py-2 text-sm rounded bg-brand text-brand-fg hover:bg-brand-hover transition-colors"
                >
                  完成
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

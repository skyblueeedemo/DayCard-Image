import { useState, useEffect } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import Sidebar from '@/components/Sidebar';
import ImageGrid from '@/components/ImageGrid/ImageGrid';
import PromptInput from '@/components/DailyCard/PromptInput';
import ProviderSelector from '@/components/ProviderSelector/ProviderSelector';
import QuotaBar from '@/components/QuotaBar/QuotaBar';
import ProviderList from '@/components/ProviderManager/ProviderList';
import HistoryPage from '@/components/History/HistoryPage';
import DailyTheme from '@/components/DailyCard/DailyTheme';
import Settings from '@/components/Settings/Settings';
import ApiConfigPage from '@/components/ApiConfig/ApiConfigPage';
import ToastContainer from '@/components/Toast/ToastContainer';
import OnboardingWizard from '@/components/Onboarding/OnboardingWizard';
import OfflineBanner from '@/components/DailyCard/OfflineBanner';

function MainApp() {
  useKeyboardShortcuts();
  const isOnline = useNetworkStatus();
  const addToast = useToastStore((s) => s.addToast);

  const [activePage, setActivePage] = useState<
    'daily' | 'history' | 'providers' | 'api-config' | 'settings'
  >('daily');

  useEffect(() => {
    const unsubNav = window.electronAPI?.onEvent('navigate-to', (data) => {
      if (typeof data === 'object' && data && 'page' in data) {
        const page = (data as { page: string }).page;
        if (['daily', 'history', 'providers', 'api-config', 'settings'].includes(page)) {
          setActivePage(page as 'daily' | 'history' | 'providers' | 'api-config' | 'settings');
        }
      }
    });

    const unsubScheduler = window.electronAPI?.onEvent('scheduler:completed', () => {
      addToast('每日自动生图已完成！', 'success');
    });

    return () => {
      unsubNav?.();
      unsubScheduler?.();
    };
  }, [addToast]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <main className="flex-1 overflow-y-auto p-6">
        {activePage === 'daily' && (
          <div className="flex flex-col items-center gap-6 py-8">
            {!isOnline && <OfflineBanner />}
            <QuotaBar />
            <ProviderSelector />
            <DailyTheme />
            <PromptInput isOnline={isOnline} />
            <ImageGrid />
          </div>
        )}

        {activePage === 'history' && <HistoryPage />}

        {activePage === 'providers' && (
          <div className="flex flex-col items-center py-8">
            <ProviderList />
          </div>
        )}

        {activePage === 'api-config' && <ApiConfigPage />}

        {activePage === 'settings' && <Settings />}
      </main>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  const { firstLaunch, isHydrated, hydrate } = useSettingsStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (firstLaunch) {
    return <OnboardingWizard />;
  }

  return <MainApp />;
}

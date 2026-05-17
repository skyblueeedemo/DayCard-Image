import { useState, useEffect, useMemo } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAppearance } from '@/hooks/useAppearance';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import { storageAdapter } from '@/store/storageAdapter';
import { DEFAULT_ROUTE, isRouteId, type RouteId } from '@/router/routes';
import Sidebar from '@/components/Sidebar';
import ImageGrid from '@/components/ImageGrid/ImageGrid';
import PromptInput from '@/components/DailyCard/PromptInput';
import ProviderSelector from '@/components/ProviderSelector/ProviderSelector';
import QuotaBar from '@/components/QuotaBar/QuotaBar';
import HistoryPage from '@/components/History/HistoryPage';
import DailyThemeHistory from '@/components/History/DailyThemeHistory';
import DailyTheme from '@/components/DailyCard/DailyTheme';
import Settings from '@/components/Settings/Settings';
import ApiConfigPage from '@/components/ApiConfig/ApiConfigPage';
import FavoritesPage from '@/components/Favorites/FavoritesPage';
import ToastContainer from '@/components/Toast/ToastContainer';
import SplashScreen from '@/components/SplashScreen';
import OnboardingWizard from '@/components/Onboarding/OnboardingWizard';
import OfflineBanner from '@/components/DailyCard/OfflineBanner';
import WelcomeBanner from '@/components/DailyCard/WelcomeBanner';

function MainApp() {
  useKeyboardShortcuts();
  const isOnline = useNetworkStatus();
  const addToast = useToastStore((s) => s.addToast);

  const [activePage, setActivePage] = useState<RouteId>(DEFAULT_ROUTE);

  useEffect(() => {
    const unsubNav = window.electronAPI?.onEvent('navigate-to', (data) => {
      if (typeof data === 'object' && data && 'page' in data) {
        const page = (data as { page: string }).page;
        if (isRouteId(page)) {
          setActivePage(page);
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

  // 路由表 → 页面元素的渲染映射
  // 用 useMemo 缓存，避免每次渲染重建（DailyCard 涉及 isOnline 依赖时仍会刷新）
  const dailyView = useMemo(
    () => (
      <div className="flex flex-col items-center gap-6 py-8">
        {!isOnline && <OfflineBanner />}
        <WelcomeBanner />
        <QuotaBar />
        <ProviderSelector />
        <DailyTheme />
        <PromptInput isOnline={isOnline} />
        <ImageGrid />
      </div>
    ),
    [isOnline],
  );

  const pageRenderers: Record<RouteId, JSX.Element> = {
    daily: dailyView,
    favorites: <FavoritesPage />,
    history: <HistoryPage />,
    'theme-history': <DailyThemeHistory />,
    'api-config': <ApiConfigPage />,
    settings: <Settings />,
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <main className="flex-1 overflow-y-auto p-6">
        {pageRenderers[activePage]}
      </main>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  useAppearance();
  const { firstLaunch, isHydrated, hydrate } = useSettingsStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // 启动页：首次打开浏览器/Electron 时显示（localStorage 控制，清除后重测）
  const splashShown = storageAdapter.getString('daycard-splash-shown', '');
  const needSplash = !splashShown || firstLaunch;

  if (needSplash && showSplash) {
    return (
      <SplashScreen
        onDone={() => {
          setShowSplash(false);
          storageAdapter.setString('daycard-splash-shown', '1');
        }}
      />
    );
  }

  if (firstLaunch) {
    return <OnboardingWizard />;
  }

  return <MainApp />;
}

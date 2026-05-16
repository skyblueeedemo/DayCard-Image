import { create } from 'zustand';

interface AppSettings {
  firstLaunch: boolean;
  autoLaunch: boolean;
  schedulerEnabled: boolean;
  schedulerTime: string;
  preferredProvider: string;
  appearance: 'dark' | 'light';
}

const defaults: AppSettings = {
  firstLaunch: true,
  autoLaunch: false,
  schedulerEnabled: false,
  schedulerTime: '08:00',
  preferredProvider: '',
  appearance: 'dark',
};

interface SettingsState extends AppSettings {
  isHydrated: boolean;
  isUpdating: boolean;
  hydrate: () => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<boolean>;
  refresh: () => Promise<void>;
  setFirstLaunchComplete: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaults,
  isHydrated: false,
  isUpdating: false,

  hydrate: async () => {
    if (!window.electronAPI?.getSettings) {
      set({ ...defaults, firstLaunch: false, isHydrated: true });
      return;
    }
    try {
      const res = await window.electronAPI.getSettings();
      if (res.status === 'ok' && res.data) {
        const data = res.data as Record<string, unknown>;
        set({
          firstLaunch: (data.firstLaunch as boolean) ?? defaults.firstLaunch,
          autoLaunch: (data.autoLaunch as boolean) ?? defaults.autoLaunch,
          schedulerEnabled: (data.schedulerEnabled as boolean) ?? defaults.schedulerEnabled,
          schedulerTime: (data.schedulerTime as string) ?? defaults.schedulerTime,
          preferredProvider: (data.preferredProvider as string) ?? defaults.preferredProvider,
          appearance: (data.appearance as 'dark' | 'light') ?? defaults.appearance,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  updateSetting: async (key, value) => {
    if (!window.electronAPI?.updateSetting) return false;
    set({ isUpdating: true });
    try {
      const res = await window.electronAPI.updateSetting(key, value);
      if (res.status === 'ok') {
        set({ [key]: value, isUpdating: false } as Partial<SettingsState>);
        return true;
      }
      set({ isUpdating: false });
      return false;
    } catch {
      set({ isUpdating: false });
      return false;
    }
  },

  refresh: async () => {
    const { hydrate } = get();
    await hydrate();
  },

  setFirstLaunchComplete: async () => {
    const { updateSetting } = get();
    await updateSetting('firstLaunch', false);
    set({ firstLaunch: false });
  },
}));

export type { AppSettings };

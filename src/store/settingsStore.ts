import { create } from 'zustand';

interface AppSettings {
  firstLaunch: boolean;
  autoLaunch: boolean;
  schedulerEnabled: boolean;
  schedulerTime: string;
  preferredProvider: string;
}

interface SettingsState extends AppSettings {
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  setFirstLaunchComplete: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  firstLaunch: true,
  autoLaunch: false,
  schedulerEnabled: false,
  schedulerTime: '08:00',
  preferredProvider: '',
  isHydrated: false,

  hydrate: async () => {
    if (!window.electronAPI?.getSettings) {
      set({ firstLaunch: false, isHydrated: true });
      return;
    }
    try {
      const res = await window.electronAPI.getSettings();
      if (res.status === 'ok' && res.data) {
        set({ ...res.data, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  updateSetting: async (key, value) => {
    if (!window.electronAPI?.updateSetting) return;
    const res = await window.electronAPI.updateSetting(key, value);
    if (res.status === 'ok') {
      set({ [key]: value } as Partial<SettingsState>);
    }
  },

  setFirstLaunchComplete: async () => {
    const { updateSetting } = get();
    await updateSetting('firstLaunch', false);
    set({ firstLaunch: false });
  },
}));

export type { AppSettings };

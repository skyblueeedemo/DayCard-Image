import { readStore, writeStore } from '../storage';

interface AppSettings {
  firstLaunch: boolean;
  autoLaunch: boolean;
  schedulerEnabled: boolean;
  schedulerTime: string;
  preferredProvider: string;
  appearance: 'dark' | 'light';
}

const STORE_NAME = 'settings';

const defaults: AppSettings = {
  firstLaunch: true,
  autoLaunch: false,
  schedulerEnabled: false,
  schedulerTime: '08:00',
  preferredProvider: '',
  appearance: 'dark',
};

class SettingsService {
  getAll(): AppSettings {
    return readStore<AppSettings>(STORE_NAME, defaults);
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    const data = this.getAll();
    return data[key];
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): AppSettings {
    const data = this.getAll();
    data[key] = value;
    writeStore(STORE_NAME, data);
    return data;
  }

  reset(key: keyof AppSettings): AppSettings {
    const data = this.getAll();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data as any)[key] = defaults[key];
    writeStore(STORE_NAME, data);
    return data;
  }
}

export const settingsService = new SettingsService();
export type { AppSettings };

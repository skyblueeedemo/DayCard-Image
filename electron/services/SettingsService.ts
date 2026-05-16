import Store from 'electron-store';

interface AppSettings {
  firstLaunch: boolean;
  autoLaunch: boolean;
  schedulerEnabled: boolean;
  schedulerTime: string;
  preferredProvider: string;
}

const defaults: AppSettings = {
  firstLaunch: true,
  autoLaunch: false,
  schedulerEnabled: false,
  schedulerTime: '08:00',
  preferredProvider: '',
};

class SettingsService {
  private store: Store<AppSettings>;

  constructor() {
    this.store = new Store<AppSettings>({ defaults });
  }

  getAll(): AppSettings {
    return this.store.store;
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.store.get(key);
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): AppSettings {
    this.store.set(key, value);
    return this.getAll();
  }

  reset(key: keyof AppSettings): AppSettings {
    this.store.delete(key);
    return this.getAll();
  }
}

export const settingsService = new SettingsService();
export type { AppSettings };

export {};

declare global {
  interface Window {
    electronAPI?: {
      generateImage: (params: {
        prompt: string;
        providerId?: string;
        options?: Record<string, unknown>;
      }) => Promise<unknown>;

      getProviders: () => Promise<unknown>;

      getQuota: (providerId: string) => Promise<{
        used: number;
        total: number;
        unit: 'count' | 'credit';
      }>;

      saveImage: (params: {
        imageUrl: string;
        defaultName?: string;
      }) => Promise<{ status: string; filePath?: string; message?: string }>;

      getSettings: () => Promise<{ status: string; data?: Record<string, unknown>; message?: string }>;
      updateSetting: (key: string, value: unknown) => Promise<{ status: string; data?: Record<string, unknown>; message?: string }>;
      onEvent: (channel: string, callback: (data: unknown) => void) => () => void;
      setWallpaper?: (params: { imagePath: string }) => Promise<{ status: string; message?: string }>;
    };
  }
}

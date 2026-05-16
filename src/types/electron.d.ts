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
        status: string;
        data?: { used: number; total: number; unit: 'count' | 'credit'; resetAt?: string };
        message?: string;
      }>;
      getQuotaHistory: (providerId: string) => Promise<{
        status: string;
        data?: Array<{ providerId: string; date: string; used: number; total: number }>;
        message?: string;
      }>;
      getAllQuotas: () => Promise<{
        status: string;
        data?: Array<{ used: number; total: number; unit: 'count' | 'credit'; resetAt?: string }>;
        message?: string;
      }>;

      saveImage: (params: {
        imageUrl: string;
        defaultName?: string;
      }) => Promise<{ status: string; filePath?: string; message?: string }>;

      getSettings: () => Promise<{ status: string; data?: Record<string, unknown>; message?: string }>;
      updateSetting: (key: string, value: unknown) => Promise<{ status: string; data?: Record<string, unknown>; message?: string }>;
      onEvent: (channel: string, callback: (data: unknown) => void) => () => void;
      setWallpaper?: (params: { imagePath: string }) => Promise<{ status: string; message?: string }>;
      likePrompt?: (params: { imageUrl: string; styleId: string; sceneId: string; compositionId: string }) => Promise<{ status: string; data?: Record<string, unknown>; message?: string }>;
      unlikePrompt?: (params: { imageUrl: string; styleId: string; sceneId: string; compositionId: string }) => Promise<{ status: string; data?: Record<string, unknown>; message?: string }>;
      getPreferenceWeights?: () => Promise<{ status: string; data?: Record<string, number>; message?: string }>;
      getLikedResults?: () => Promise<{ status: string; data?: string[]; message?: string }>;
      checkForUpdate?: () => Promise<{ status: string; message?: string }>;
      downloadUpdate?: () => Promise<{ status: string; message?: string }>;
      installUpdate?: () => Promise<unknown>;
    };
  }
}

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
        data?: Record<string, { used: number; total: number; unit: 'count' | 'credit'; resetAt?: string }>;
        message?: string;
      }>;
      getModelQuota?: (params: { providerId: string; modelId: string }) => Promise<{
        status: string;
        data?: { used: number; total: number; unit: 'count' | 'credit'; resetAt?: string };
        message?: string;
      }>;

      saveImage: (params: {
        imageUrl: string;
        defaultName?: string;
      }) => Promise<{ status: string; filePath?: string; message?: string }>;

      getSettings: () => Promise<{ status: string; data?: Record<string, unknown>; message?: string }>;
      updateSetting: (key: string, value: unknown) => Promise<{ status: string; data?: Record<string, unknown>; message?: string }>;
      onEvent: (channel: string, callback: (data: unknown) => void) => () => void;
      setWallpaper?: (params: { imagePath: string }) => Promise<{ status: string; data?: { archivedPath?: string }; message?: string }>;
      deleteWallpaper?: (params: { dateStr: string }) => Promise<{ status: string; message?: string }>;
      likePrompt?: (params: { imageUrl: string; styleId: string; sceneId: string; compositionId: string }) => Promise<{ status: string; data?: Record<string, unknown>; message?: string }>;
      unlikePrompt?: (params: { imageUrl: string; styleId: string; sceneId: string; compositionId: string }) => Promise<{ status: string; data?: Record<string, unknown>; message?: string }>;
      getPreferenceWeights?: () => Promise<{ status: string; data?: Record<string, number>; message?: string }>;
      getLikedResults?: () => Promise<{ status: string; data?: string[]; message?: string }>;
      loadResults?: () => Promise<{ status: string; data?: unknown[]; message?: string }>;
      saveResults?: (results: unknown[]) => Promise<{ status: string; message?: string }>;
      getConfig?: () => Promise<{ status: string; data?: Record<string, unknown>; message?: string }>;
      updateConfig?: (params: { providerId: string; apiKey?: string; baseURL?: string; models?: Record<string, { description?: string; remaining: number; total: number }> }) => Promise<{ status: string; message?: string }>;
      testConnection?: (params: { providerId: string; apiKey: string; baseURL?: string }) => Promise<{ status: string; message?: string; latencyMs?: number; errorCode?: string }>;
      setProviderOrder?: (order: string[]) => Promise<{ status: string; message?: string }>;
      listProviderModels?: (providerId: string) => Promise<{ status: string; data?: Array<{ id: string; name?: string; description?: string }>; message?: string }>;
      checkForUpdate?: () => Promise<{ status: string; message?: string }>;
      downloadUpdate?: () => Promise<{ status: string; message?: string }>;
      installUpdate?: () => Promise<unknown>;
    };
  }
}

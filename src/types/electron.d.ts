export {};

declare global {
  interface Window {
    electronAPI: {
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
    };
  }
}

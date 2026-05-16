import { ipcMain } from 'electron';
import { quotaService } from '../services/QuotaService';

function registerQuotaIpc(): void {
  ipcMain.handle('quota:get', async (_event, providerId: string) => {
    try {
      const data = quotaService.getQuota(providerId);
      return { status: 'ok', data };
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取配额失败';
      return { status: 'error', message };
    }
  });

  ipcMain.handle('quota:history', async (_event, providerId: string) => {
    try {
      const data = quotaService.getHistory(providerId);
      return { status: 'ok', data };
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取配额历史失败';
      return { status: 'error', message };
    }
  });

  ipcMain.handle('quota:get-model', async (_event, params: { providerId: string; modelId: string }) => {
    try {
      const data = quotaService.getModelQuota(params.providerId, params.modelId);
      return { status: 'ok', data };
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取模型配额失败';
      return { status: 'error', message };
    }
  });

  ipcMain.handle('quota:all', async () => {
    try {
      const data = quotaService.getAllQuotas();
      return { status: 'ok', data };
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取全部配额失败';
      return { status: 'error', message };
    }
  });
}

export { registerQuotaIpc };

import { ipcMain } from 'electron';
import { settingsService } from '../services/SettingsService';
import { autoLaunchService } from '../services/AutoLaunchService';
import { schedulerService } from '../services/SchedulerService';
import type { AppSettings } from '../services/SettingsService';

function registerSystemIpc(): void {
  ipcMain.handle('settings:get', async () => {
    try {
      const data = settingsService.getAll();
      return { status: 'ok', data };
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取设置失败';
      return { status: 'error', message };
    }
  });

  ipcMain.handle('settings:set', async (_event, { key, value }: { key: keyof AppSettings; value: unknown }) => {
    try {
      const data = settingsService.set(key, value as never);

      if (key === 'autoLaunch') {
        if (value) {
          await autoLaunchService.enable();
        } else {
          await autoLaunchService.disable();
        }
      }

      if (key === 'schedulerEnabled' || key === 'schedulerTime') {
        schedulerService.reschedule();
      }

      return { status: 'ok', data };
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存设置失败';
      return { status: 'error', message };
    }
  });

  ipcMain.handle('system:is-first-launch', async () => {
    try {
      const firstLaunch = settingsService.get('firstLaunch');
      return { status: 'ok', data: firstLaunch };
    } catch (err) {
      const message = err instanceof Error ? err.message : '查询失败';
      return { status: 'error', message };
    }
  });

  ipcMain.handle('system:auto-launch-get', async () => {
    try {
      const enabled = await autoLaunchService.isEnabled();
      return { status: 'ok', data: enabled };
    } catch (err) {
      const message = err instanceof Error ? err.message : '查询失败';
      return { status: 'error', message };
    }
  });

  ipcMain.handle('system:auto-launch-set', async (_event, { enabled }: { enabled: boolean }) => {
    try {
      if (enabled) {
        await autoLaunchService.enable();
      } else {
        await autoLaunchService.disable();
      }
      settingsService.set('autoLaunch', enabled);
      return { status: 'ok', data: settingsService.getAll() };
    } catch (err) {
      const message = err instanceof Error ? err.message : '设置失败';
      return { status: 'error', message };
    }
  });
}

export { registerSystemIpc };

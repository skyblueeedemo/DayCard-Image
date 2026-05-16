import { Notification, BrowserWindow } from 'electron';
import cron from 'node-cron';
import { settingsService } from './SettingsService';
import { imageIpc } from '../ipc/imageGeneration';

class SchedulerService {
  private task: cron.ScheduledTask | null = null;
  private mainWindow: BrowserWindow | null = null;

  setWindow(win: BrowserWindow): void {
    this.mainWindow = win;
  }

  initialize(): void {
    const enabled = settingsService.get('schedulerEnabled');
    if (enabled) {
      const time = settingsService.get('schedulerTime');
      this.startCron(time);
    }
  }

  reschedule(newTime?: string, enabled?: boolean): void {
    this.stopCron();

    const isEnabled = enabled ?? settingsService.get('schedulerEnabled');
    if (!isEnabled) return;

    const time = newTime ?? settingsService.get('schedulerTime');
    this.startCron(time);
  }

  private startCron(time: string): void {
    const [hour, minute] = time.split(':').map(Number);
    const cronExpr = `${minute} ${hour} * * *`;
    this.task = cron.schedule(cronExpr, async () => {
      await this.executeScheduledGeneration();
    });
  }

  private stopCron(): void {
    this.task?.stop();
    this.task = null;
  }

  private async executeScheduledGeneration(): Promise<void> {
    if (!settingsService.get('schedulerEnabled')) return;

    try {
      const result = await imageIpc.handleGenerate({ prompt: 'daily theme' });
      const notification = new Notification({
        title: '拾光匣',
        body: '今日图像已生成，点击查看',
      });
      notification.on('click', () => {
        if (this.mainWindow) {
          this.mainWindow.show();
          this.mainWindow.focus();
          this.mainWindow.webContents.send('navigate-to', { page: 'daily' });
        }
      });
      notification.show();

      if (this.mainWindow) {
        this.mainWindow.webContents.send('scheduler:completed', {
          imageUrl: (result as Record<string, unknown>).url,
        });
      }
    } catch (err) {
      console.error('[Scheduler] 自动生图失败', err);
    }
  }

  destroy(): void {
    this.stopCron();
  }
}

export const schedulerService = new SchedulerService();

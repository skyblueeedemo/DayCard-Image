import { BrowserWindow } from 'electron';

class NetworkService {
  private interval: ReturnType<typeof setInterval> | null = null;
  private mainWindow: BrowserWindow | null = null;
  private wasOnline = true;

  setWindow(win: BrowserWindow): void {
    this.mainWindow = win;
  }

  startMonitoring(): void {
    if (this.interval) return;

    // 每 30 秒 HEAD 探活
    this.interval = setInterval(async () => {
      const isOnline = await this.checkConnectivity();
      if (isOnline !== this.wasOnline) {
        this.wasOnline = isOnline;
        this.mainWindow?.webContents.send('network:status-changed', { online: isOnline });
      }
    }, 30_000);
  }

  stopMonitoring(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async checkConnectivity(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);
      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  }

  destroy(): void {
    this.stopMonitoring();
  }
}

export const networkService = new NetworkService();

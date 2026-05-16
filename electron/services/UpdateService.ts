import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow } from 'electron';

class UpdateService {
  private mainWindow: BrowserWindow | null = null;
  private initialized = false;

  initialize(win: BrowserWindow): void {
    if (this.initialized) return;
    if (!app.isPackaged) return;

    this.mainWindow = win;
    this.initialized = true;

    autoUpdater.autoDownload = false;
    autoUpdater.allowPrerelease = false;

    autoUpdater.on('update-available', (info) => {
      this.mainWindow?.webContents.send('update:available', {
        version: info.version,
        releaseDate: info.releaseDate,
      });
    });

    autoUpdater.on('update-not-available', () => {
      this.mainWindow?.webContents.send('update:not-available');
    });

    autoUpdater.on('update-downloaded', () => {
      this.mainWindow?.webContents.send('update:downloaded');
    });

    autoUpdater.on('error', (err) => {
      this.mainWindow?.webContents.send('update:error', { message: err.message });
    });

    // 启动后 5 秒静默检查
    setTimeout(() => {
      this.checkForUpdates(true);
    }, 5_000);
  }

  async checkForUpdates(silent = true): Promise<void> {
    if (!app.isPackaged) return;
    try {
      await autoUpdater.checkForUpdates();
    } catch (err) {
      if (!silent) {
        this.mainWindow?.webContents.send('update:error', {
          message: err instanceof Error ? err.message : '检查更新失败',
        });
      }
    }
  }

  async downloadUpdate(): Promise<void> {
    if (!app.isPackaged) return;
    try {
      await autoUpdater.downloadUpdate();
    } catch (err) {
      this.mainWindow?.webContents.send('update:error', {
        message: err instanceof Error ? err.message : '下载更新失败',
      });
    }
  }

  installUpdate(): void {
    autoUpdater.quitAndInstall();
  }
}

export const updateService = new UpdateService();

import { ipcMain } from 'electron';
import { wallpaperService } from '../services/WallpaperService';

function registerWallpaperIpc(): void {
  ipcMain.handle('wallpaper:set', async (_event, params: { imagePath: string }) => {
    try {
      const result = await wallpaperService.setWallpaper(params.imagePath);
      if (result.success) {
        return { status: 'ok', data: { archivedPath: result.archivedPath } };
      }
      return { status: 'error', message: result.error ?? '设置壁纸失败' };
    } catch (err) {
      const message = err instanceof Error ? err.message : '设置壁纸失败';
      return { status: 'error', message };
    }
  });

  ipcMain.handle('wallpaper:delete', async (_event, params: { dateStr: string }) => {
    try {
      await wallpaperService.deleteByDate(params.dateStr);
      return { status: 'ok' };
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除壁纸失败';
      return { status: 'error', message };
    }
  });
}

export { registerWallpaperIpc };

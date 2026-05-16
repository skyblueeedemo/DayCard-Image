import { app, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import sharp from 'sharp';

class WallpaperService {
  private readonly archiveDir: string;

  constructor() {
    this.archiveDir = path.join(app.getPath('pictures'), 'DayCard-Image', 'wallpapers');
  }

  async setWallpaper(imagePathOrUrl: string): Promise<{ success: boolean; archivedPath?: string; error?: string }> {
    try {
      const localPath = await this.resolveToLocalPath(imagePathOrUrl);

      const display = screen.getPrimaryDisplay();
      const { width, height } = display.workAreaSize;

      const now = new Date();
      const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const archiveName = `${ts}.png`;

      fs.mkdirSync(this.archiveDir, { recursive: true });
      const archivedPath = path.join(this.archiveDir, archiveName);

      await sharp(localPath)
        .resize(width, height, { fit: 'cover', position: 'center' })
        .png()
        .toFile(archivedPath);

      await this.applyWallpaper(archivedPath);

      return { success: true, archivedPath };
    } catch (err) {
      const message = err instanceof Error ? err.message : '设置壁纸失败';
      return { success: false, error: message };
    }
  }

  private async resolveToLocalPath(input: string): Promise<string> {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      const res = await fetch(input);
      const buffer = Buffer.from(await res.arrayBuffer());
      const tmpPath = path.join(app.getPath('temp'), `daycard-wallpaper-${Date.now()}.tmp`);
      fs.writeFileSync(tmpPath, buffer);
      return tmpPath;
    }
    if (input.startsWith('data:')) {
      const base64Data = input.includes(',') ? input.split(',')[1] : input;
      const buffer = Buffer.from(base64Data, 'base64');
      const tmpPath = path.join(app.getPath('temp'), `daycard-wallpaper-${Date.now()}.tmp`);
      fs.writeFileSync(tmpPath, buffer);
      return tmpPath;
    }
    return input;
  }

  private async applyWallpaper(imagePath: string): Promise<void> {
    const platform = process.platform;

    if (platform === 'win32') {
      const escapedPath = imagePath.replace(/\\/g, '\\\\');
      const psScript = `
        Add-Type -TypeDefinition @'
        using System;
        using System.Runtime.InteropServices;
        public class WallpaperHelper {
          [DllImport("user32.dll", CharSet = CharSet.Auto)]
          public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);
        }
'@;
        [WallpaperHelper]::SystemParametersInfo(0x0014, 0, '${escapedPath}', 0x0002);
      `;
      execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/\n/g, ' ').replace(/\r/g, '')}"`, { timeout: 10000 });
    } else if (platform === 'darwin') {
      execSync(`osascript -e 'tell application "Finder" to set desktop picture to POSIX file "${imagePath}"'`, { timeout: 5000 });
    } else {
      execSync(`gsettings set org.gnome.desktop.background picture-uri "file://${imagePath}"`, { timeout: 5000 });
    }
  }
}

export const wallpaperService = new WallpaperService();

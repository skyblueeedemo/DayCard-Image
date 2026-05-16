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
      fs.mkdirSync(this.archiveDir, { recursive: true });

      const now = new Date();
      const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const archiveName = `${ts}.png`;
      const archivedPath = path.join(this.archiveDir, archiveName);

      // 下载到归档目录（不用临时文件）
      if (imagePathOrUrl.startsWith('http://') || imagePathOrUrl.startsWith('https://')) {
        const res = await fetch(imagePathOrUrl, {
          redirect: 'follow',
          headers: { 'User-Agent': 'DayCard-Image/1.2.0' },
        });
        if (!res.ok) {
          throw new Error(`下载壁纸图片失败 (HTTP ${res.status})`);
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(archivedPath, buffer);
      } else if (imagePathOrUrl.startsWith('data:')) {
        const commaIdx = imagePathOrUrl.indexOf(',');
        const base64Data = commaIdx >= 0 ? imagePathOrUrl.slice(commaIdx + 1) : imagePathOrUrl;
        fs.writeFileSync(archivedPath, Buffer.from(base64Data, 'base64'));
      } else {
        // 本地文件：直接复制
        fs.copyFileSync(imagePathOrUrl, archivedPath);
      }

      // 校验下载结果
      const stat = fs.statSync(archivedPath);
      if (stat.size < 1024) {
        throw new Error('下载的图像文件无效（文件过小）');
      }

      // 适配屏幕分辨率
      const display = screen.getPrimaryDisplay();
      const { width, height } = display.workAreaSize;

      const resizedPath = archivedPath.replace(/\.png$/, '_resized.png');
      await sharp(archivedPath)
        .resize(width, height, { fit: 'cover', position: 'center' })
        .png()
        .toFile(resizedPath);

      // 校验 resize 结果
      const resizeStat = fs.statSync(resizedPath);
      if (resizeStat.size < 1024) {
        throw new Error('图像处理后文件无效');
      }

      // 用 resize 后的替换原文件
      fs.unlinkSync(archivedPath);
      fs.renameSync(resizedPath, archivedPath);

      await this.applyWallpaper(archivedPath);

      return { success: true, archivedPath };
    } catch (err) {
      const message = err instanceof Error ? err.message : '设置壁纸失败';
      return { success: false, error: message };
    }
  }

  private async applyWallpaper(imagePath: string): Promise<void> {
    const platform = process.platform;

    if (platform === 'win32') {
      const absPath = path.resolve(imagePath);
      // 不转义反斜杠 — PS 单引号内是字面量
      const psLines = [
        '$code = @"',
        'using System;',
        'using System.Runtime.InteropServices;',
        'public class W {',
        '    [DllImport("user32.dll", CharSet = CharSet.Auto)]',
        '    public static extern int SystemParametersInfo(int a, int b, string c, int d);',
        '}',
        '"@',
        'Add-Type -TypeDefinition $code',
        `[W]::SystemParametersInfo(0x0014, 0, '${absPath}', 3)`,
      ];
      const tmpScript = path.join(app.getPath('temp'), 'daycard-wallpaper.ps1');
      fs.writeFileSync(tmpScript, psLines.join('\n'), 'utf-8');
      execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpScript}"`, { timeout: 10000 });
      try { fs.unlinkSync(tmpScript); } catch { /* cleanup */ }
    } else if (platform === 'darwin') {
      execSync(`osascript -e 'tell application "Finder" to set desktop picture to POSIX file "${imagePath}"'`, { timeout: 5000 });
    } else {
      execSync(`gsettings set org.gnome.desktop.background picture-uri "file://${imagePath}"`, { timeout: 5000 });
    }
  }
}

export const wallpaperService = new WallpaperService();

import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron';

const ICON_SIZE = 16;

function createTrayIconDataUrl(): string {
  const size = ICON_SIZE;
  const canvas = Buffer.alloc(size * size * 4);
  const center = size / 2;
  const outerR = size / 2 - 1;
  const innerR = size / 2 - 4;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - center + 0.5;
      const dy = y - center + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= outerR && dist > innerR) {
        canvas[idx] = 59;
        canvas[idx + 1] = 130;
        canvas[idx + 2] = 246;
        canvas[idx + 3] = 255;
      } else if (dist <= innerR) {
        canvas[idx] = 59;
        canvas[idx + 1] = 130;
        canvas[idx + 2] = 246;
        canvas[idx + 3] = 120;
      } else {
        canvas[idx + 3] = 0;
      }
    }
  }

  const img = nativeImage.createFromBuffer(canvas, {
    width: size,
    height: size,
  });
  return img.toDataURL();
}

class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;

    const iconDataUrl = createTrayIconDataUrl();
    const icon = nativeImage.createFromDataURL(iconDataUrl);
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));

    this.tray.setToolTip('拾光匣 · DayCard Image');

    const menu = Menu.buildFromTemplate([
      {
        label: '今日抽卡',
        click: () => {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('navigate-to', { page: 'daily' });
        },
      },
      {
        label: '打开拾光匣',
        click: () => {
          mainWindow.show();
          mainWindow.focus();
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          app.exit(0);
        },
      },
    ]);

    this.tray.setContextMenu(menu);

    this.tray.on('double-click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  }

  updateTooltip(remaining?: number): void {
    if (!this.tray) return;
    if (remaining !== undefined) {
      this.tray.setToolTip(`拾光匣 · 今日剩余 ${remaining} 张`);
    } else {
      this.tray.setToolTip('拾光匣 · DayCard Image');
    }
  }

  destroy(): void {
    this.tray?.destroy();
    this.tray = null;
  }
}

export const trayManager = new TrayManager();

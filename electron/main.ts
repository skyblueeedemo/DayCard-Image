import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: '拾光匣 - DayCard Image',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── IPC Handlers ───────────────────────────────────────
function registerIpcHandlers(): void {
  ipcMain.handle('image:generate', async (_event, params) => {
    // 由 ProviderManager 调度，此处为占位
    console.log('[IPC] image:generate', params);
    return { status: 'ok', message: 'not yet implemented' };
  });

  ipcMain.handle('provider:list', async () => {
    console.log('[IPC] provider:list');
    return { status: 'ok', providers: [] };
  });

  ipcMain.handle('quota:get', async (_event, providerId: string) => {
    console.log('[IPC] quota:get', providerId);
    return { used: 0, total: 0, unit: 'count' as const };
  });
}

// ─── App Lifecycle ──────────────────────────────────────
app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

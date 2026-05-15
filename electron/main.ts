import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { imageIpc } from './ipc/imageGeneration';

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
    try {
      const result = await imageIpc.handleGenerate(params);
      return { status: 'ok', data: result };
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成失败';
      return { status: 'error', message };
    }
  });

  ipcMain.handle('provider:list', async () => {
    try {
      const providers = imageIpc.getProviders();
      return { status: 'ok', providers };
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取 Provider 列表失败';
      return { status: 'error', message, providers: [] };
    }
  });

  ipcMain.handle('quota:get', async (_event, providerId: string) => {
    try {
      const quota = imageIpc.getQuota(providerId);
      return { status: 'ok', data: quota };
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取配额失败';
      return { status: 'error', message };
    }
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

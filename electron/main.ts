import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { imageIpc } from './ipc/imageGeneration';
import { fileSystemIpc } from './ipc/fileSystem';
import { registerSystemIpc } from './ipc/system';
import { registerWallpaperIpc } from './ipc/wallpaper';
import { registerQuotaIpc } from './ipc/quota';
import { registerPreferenceIpc } from './ipc/preference';
import { registerConfigIpc } from './ipc/config';

import { trayManager } from './tray/TrayManager';
import { schedulerService } from './services/SchedulerService';
import { networkService } from './services/NetworkService';
import { updateService } from './services/UpdateService';
import { readStore, writeStore } from './storage';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

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

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

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

  ipcMain.handle('file:save-image', fileSystemIpc.handleSaveImage);

  registerSystemIpc();
  registerWallpaperIpc();
  registerQuotaIpc();
  registerPreferenceIpc();
  registerConfigIpc();

  // 结果持久化
  ipcMain.handle('results:load', async () => {
    try {
      const data = readStore<{ results: unknown[] }>('results', { results: [] });
      return { status: 'ok', data: data.results };
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载结果失败';
      return { status: 'error', message };
    }
  });
  ipcMain.handle('results:save', async (_event, results: unknown[]) => {
    try {
      writeStore('results', { results: results.slice(0, 500) });
      return { status: 'ok' };
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存结果失败';
      return { status: 'error', message };
    }
  });

  // Auto-update handlers
  ipcMain.handle('update:check', async () => {
    await updateService.checkForUpdates(false);
    return { status: 'ok' };
  });
  ipcMain.handle('update:download', async () => {
    await updateService.downloadUpdate();
    return { status: 'ok' };
  });
  ipcMain.handle('update:install', async () => {
    updateService.installUpdate();
    return { status: 'ok' };
  });
}

// ─── App Lifecycle ──────────────────────────────────────
app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
  trayManager.init(mainWindow!);
  schedulerService.setWindow(mainWindow!);
  schedulerService.initialize();
  networkService.setWindow(mainWindow!);
  networkService.startMonitoring();
  updateService.initialize(mainWindow!);

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show();
    } else {
      createWindow();
      trayManager.init(mainWindow!);
      schedulerService.setWindow(mainWindow!);
      schedulerService.initialize();
      networkService.setWindow(mainWindow!);
      networkService.startMonitoring();
      updateService.initialize(mainWindow!);
    }
  });
});

app.on('window-all-closed', () => {
  // 不退出 — 应用常驻托盘
});

app.on('before-quit', () => {
  isQuitting = true;
});

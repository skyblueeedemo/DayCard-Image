import { dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

interface SaveImageParams {
  imageUrl: string;
  defaultName?: string;
}

async function handleSaveImage(
  _event: Electron.IpcMainInvokeEvent,
  params: SaveImageParams,
): Promise<{ status: string; filePath?: string; message?: string }> {
  try {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      return { status: 'error', message: '无活动窗口' };
    }

    // 确定默认文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const defaultName = params.defaultName ?? `daycard-${timestamp}.png`;

    // 弹出保存对话框
    const result = await dialog.showSaveDialog(win, {
      title: '保存图像',
      defaultPath: defaultName,
      filters: [
        { name: 'PNG 图像', extensions: ['png'] },
        { name: 'JPEG 图像', extensions: ['jpg', 'jpeg'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { status: 'cancelled' };
    }

    // 处理 data URL
    let imageData: Buffer;
    if (params.imageUrl.startsWith('data:')) {
      const base64 = params.imageUrl.split(',')[1];
      if (!base64) {
        return { status: 'error', message: '无效的 data URL' };
      }
      imageData = Buffer.from(base64, 'base64');
    } else {
      // 远程 URL：下载
      const response = await fetch(params.imageUrl);
      if (!response.ok) {
        return {
          status: 'error',
          message: `下载图像失败: HTTP ${response.status}`,
        };
      }
      const arrayBuffer = await response.arrayBuffer();
      imageData = Buffer.from(arrayBuffer);
    }

    // 确保扩展名
    let filePath = result.filePath;
    const ext = path.extname(filePath).toLowerCase();
    if (!ext) {
      filePath += '.png';
    }

    // 写入文件
    fs.writeFileSync(filePath, imageData);

    return { status: 'ok', filePath };
  } catch (err) {
    const message = err instanceof Error ? err.message : '保存失败';
    return { status: 'error', message };
  }
}

export const fileSystemIpc = {
  handleSaveImage,
};

import { ipcMain } from 'electron';
import { readStore, writeStore } from '../storage';

interface PreferenceStore {
  wordWeights: Record<string, number>;
  likedResults: string[];
}

const STORE_NAME = 'preferences';
const defaults: PreferenceStore = { wordWeights: {}, likedResults: [] };

function registerPreferenceIpc(): void {
  ipcMain.handle('preference:like', async (_event, params: {
    imageUrl: string;
    styleId: string;
    sceneId: string;
    compositionId: string;
  }) => {
    try {
      const data = readStore<PreferenceStore>(STORE_NAME, defaults);

      const keys = [
        `style:${params.styleId}`,
        `scene:${params.sceneId}`,
        `composition:${params.compositionId}`,
      ];
      for (const k of keys) {
        data.wordWeights[k] = (data.wordWeights[k] ?? 0) + 1;
      }

      if (!data.likedResults.includes(params.imageUrl)) {
        data.likedResults.push(params.imageUrl);
      }

      writeStore(STORE_NAME, data);
      return { status: 'ok', data: { wordWeights: data.wordWeights, likedResults: data.likedResults } };
    } catch (err) {
      const message = err instanceof Error ? err.message : '偏好记录失败';
      return { status: 'error', message };
    }
  });

  ipcMain.handle('preference:unlike', async (_event, params: {
    imageUrl: string;
    styleId: string;
    sceneId: string;
    compositionId: string;
  }) => {
    try {
      const data = readStore<PreferenceStore>(STORE_NAME, defaults);

      const keys = [
        `style:${params.styleId}`,
        `scene:${params.sceneId}`,
        `composition:${params.compositionId}`,
      ];
      for (const k of keys) {
        if (data.wordWeights[k]) {
          data.wordWeights[k] = Math.max(0, data.wordWeights[k] - 1);
        }
      }

      data.likedResults = data.likedResults.filter((u) => u !== params.imageUrl);
      writeStore(STORE_NAME, data);
      return { status: 'ok', data: { wordWeights: data.wordWeights, likedResults: data.likedResults } };
    } catch (err) {
      const message = err instanceof Error ? err.message : '取消偏好失败';
      return { status: 'error', message };
    }
  });

  ipcMain.handle('preference:get-weights', async () => {
    try {
      const data = readStore<PreferenceStore>(STORE_NAME, defaults);
      return { status: 'ok', data: data.wordWeights };
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取偏好权重失败';
      return { status: 'error', message };
    }
  });

  ipcMain.handle('preference:get-liked', async () => {
    try {
      const data = readStore<PreferenceStore>(STORE_NAME, defaults);
      return { status: 'ok', data: data.likedResults };
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取喜欢列表失败';
      return { status: 'error', message };
    }
  });
}

export { registerPreferenceIpc };

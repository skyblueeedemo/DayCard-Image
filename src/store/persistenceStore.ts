import type { ImageResult } from '@/providers/IImageProvider';

const STORAGE_KEY = 'daycard-results';
const MAX_ENTRIES = 500;
const STORAGE_VERSION = 1;

interface StorageData {
  version: number;
  results: ImageResult[];
}

function loadFromLocalStorage(): ImageResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data: StorageData = JSON.parse(raw);
    if (data.version !== STORAGE_VERSION) return [];
    return data.results ?? [];
  } catch {
    return [];
  }
}

function saveToLocalStorage(results: ImageResult[]): void {
  const trimmed = results.slice(0, MAX_ENTRIES);
  const data: StorageData = { version: STORAGE_VERSION, results: trimmed };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

async function saveToMainProcess(results: ImageResult[]): Promise<void> {
  if (typeof window !== 'undefined' && window.electronAPI?.saveResults) {
    try {
      await window.electronAPI.saveResults(results);
    } catch {
      // fallback to localStorage only
    }
  }
}

async function loadFromMainProcess(): Promise<ImageResult[] | null> {
  if (typeof window !== 'undefined' && window.electronAPI?.loadResults) {
    try {
      const res = await window.electronAPI.loadResults();
      if (res.status === 'ok' && Array.isArray(res.data)) {
        return res.data as ImageResult[];
      }
    } catch {
      // fallback to localStorage
    }
  }
  return null;
}

function load(): ImageResult[] {
  return loadFromLocalStorage();
}

async function loadAsync(): Promise<ImageResult[]> {
  // 优先从主进程文件加载（更可靠）
  const fromMain = await loadFromMainProcess();
  if (fromMain && fromMain.length > 0) {
    // 同步回 localStorage
    saveToLocalStorage(fromMain);
    return fromMain;
  }
  return loadFromLocalStorage();
}

function save(results: ImageResult[]): void {
  saveToLocalStorage(results);
  // 异步备份到主进程
  saveToMainProcess(results);
}

function addResult(result: ImageResult): ImageResult[] {
  const results = load();
  const updated = [result, ...results];
  save(updated);
  return updated;
}

function clearAll(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export const persistenceStore = {
  load,
  loadAsync,
  save,
  addResult,
  clearAll,
};

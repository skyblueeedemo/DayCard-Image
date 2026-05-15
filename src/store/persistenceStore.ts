import type { ImageResult } from '@/providers/IImageProvider';

const STORAGE_KEY = 'daycard-results';
const MAX_ENTRIES = 500;
const STORAGE_VERSION = 1;

interface StorageData {
  version: number;
  results: ImageResult[];
}

function load(): ImageResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const data: StorageData = JSON.parse(raw);
    if (data.version !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    return data.results;
  } catch {
    return [];
  }
}

function save(results: ImageResult[]): void {
  const trimmed = results.slice(0, MAX_ENTRIES);
  const data: StorageData = { version: STORAGE_VERSION, results: trimmed };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage 配额已满时静默失败
  }
}

function addResult(result: ImageResult): ImageResult[] {
  const results = load();
  const updated = [result, ...results];
  save(updated);
  return updated;
}

function clearAll(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export const persistenceStore = {
  load,
  save,
  addResult,
  clearAll,
};

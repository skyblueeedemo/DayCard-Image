/**
 * storageAdapter — renderer 进程统一的 localStorage 读写封装
 *
 * 设计目标：
 * 1. 把项目内分散的 try/catch + JSON.parse 模式收敛到一处
 * 2. 在浏览器/Electron renderer 不可用 localStorage 时优雅降级（返回 fallback / no-op）
 * 3. 不做命名空间前缀（保持向后兼容现有 key）
 *
 * 注意：
 * - 本模块只覆盖 renderer 域的 localStorage
 * - Electron 主进程 userData 那一侧（quota.json / settings.json / config.json 等）
 *   仍由 electron/storage.ts 与 IPC 处理，不在本模块范围
 */

function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * 读取并 JSON.parse；失败或键不存在时返回 fallback。
 */
export function getJSON<T>(key: string, fallback: T): T {
  if (!isStorageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * JSON.stringify 后写入；失败时静默忽略（与原项目行为一致）。
 * 返回 boolean 表示是否成功，调用方按需判断。
 */
export function setJSON(key: string, value: unknown): boolean {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * 读取原始字符串；不存在或异常时返回 fallback。
 */
export function getString(key: string, fallback = ''): string {
  if (!isStorageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * 写入原始字符串；失败时静默忽略。
 */
export function setString(key: string, value: string): boolean {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * 删除指定 key；失败时静默忽略。
 */
export function remove(key: string): boolean {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查 key 是否存在（区分 null vs 空字符串）。
 */
export function has(key: string): boolean {
  if (!isStorageAvailable()) return false;
  try {
    return window.localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

export const storageAdapter = {
  getJSON,
  setJSON,
  getString,
  setString,
  remove,
  has,
};

export default storageAdapter;

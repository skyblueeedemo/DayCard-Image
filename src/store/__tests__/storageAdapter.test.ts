import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storageAdapter, getJSON, setJSON, getString, setString, remove, has } from '../storageAdapter';

/**
 * 创建一个内存模拟的 localStorage，符合 Storage 接口行为。
 */
function createMockLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => (store.has(key) ? (store.get(key) as string) : null)),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => store.clear()),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    get length() {
      return store.size;
    },
    __store: store,
  };
}

describe('storageAdapter', () => {
  describe('环境不可用（无 window/localStorage）', () => {
    beforeEach(() => {
      vi.stubGlobal('window', undefined);
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('getJSON 返回 fallback', () => {
      expect(getJSON('any-key', { foo: 'bar' })).toEqual({ foo: 'bar' });
    });

    it('setJSON 返回 false 且不抛异常', () => {
      expect(setJSON('any-key', { value: 1 })).toBe(false);
    });

    it('getString 返回 fallback', () => {
      expect(getString('any-key', 'default')).toBe('default');
    });

    it('remove / has / setString 不抛异常', () => {
      expect(() => remove('x')).not.toThrow();
      expect(has('x')).toBe(false);
      expect(setString('x', 'y')).toBe(false);
    });
  });

  describe('环境可用（mock localStorage）', () => {
    let mockLs: ReturnType<typeof createMockLocalStorage>;

    beforeEach(() => {
      mockLs = createMockLocalStorage();
      vi.stubGlobal('window', { localStorage: mockLs });
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('setJSON / getJSON 往返一致', () => {
      const value = { a: 1, b: ['x', 'y'], c: true };
      expect(setJSON('test-key', value)).toBe(true);
      expect(getJSON('test-key', null)).toEqual(value);
      expect(mockLs.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(value));
    });

    it('getJSON 在 key 不存在时返回 fallback', () => {
      expect(getJSON('missing-key', { fallback: true })).toEqual({ fallback: true });
    });

    it('getJSON 在原始值不是合法 JSON 时返回 fallback（不抛异常）', () => {
      mockLs.__store.set('bad-json', '{not valid json');
      expect(getJSON('bad-json', [])).toEqual([]);
    });

    it('setString / getString 往返一致', () => {
      expect(setString('plain', 'hello')).toBe(true);
      expect(getString('plain', '')).toBe('hello');
    });

    it('has 区分 key 存在与不存在', () => {
      expect(has('absent')).toBe(false);
      mockLs.__store.set('present', '');
      expect(has('present')).toBe(true);
    });

    it('remove 删除 key 后 has 返回 false', () => {
      mockLs.__store.set('to-remove', 'value');
      expect(has('to-remove')).toBe(true);
      expect(remove('to-remove')).toBe(true);
      expect(has('to-remove')).toBe(false);
    });

    it('default export 与命名导出指向同一组函数', () => {
      expect(storageAdapter.getJSON).toBe(getJSON);
      expect(storageAdapter.setJSON).toBe(setJSON);
      expect(storageAdapter.remove).toBe(remove);
    });
  });

  describe('localStorage 抛异常时（quota / disabled cookies）', () => {
    let mockLs: ReturnType<typeof createMockLocalStorage>;

    beforeEach(() => {
      mockLs = createMockLocalStorage();
      mockLs.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      vi.stubGlobal('window', { localStorage: mockLs });
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('setJSON 返回 false 且不抛异常', () => {
      expect(setJSON('k', { big: 'data' })).toBe(false);
    });

    it('setString 返回 false 且不抛异常', () => {
      expect(setString('k', 'v')).toBe(false);
    });
  });
});

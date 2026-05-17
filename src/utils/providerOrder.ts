import { storageAdapter } from '@/store/storageAdapter';

const STORAGE_KEY = 'daycard-provider-order';

export function loadOrder(): string[] {
  return storageAdapter.getJSON<string[]>(STORAGE_KEY, []);
}

export function saveOrder(order: string[]): void {
  storageAdapter.setJSON(STORAGE_KEY, order);
}

// ─── 模型排序 ─────────────────────────────────────

function modelOrderKey(providerId: string): string {
  return `daycard-model-order-${providerId}`;
}

export function loadModelOrder(providerId: string): string[] {
  return storageAdapter.getJSON<string[]>(modelOrderKey(providerId), []);
}

export function saveModelOrder(providerId: string, order: string[]): void {
  storageAdapter.setJSON(modelOrderKey(providerId), order);
}

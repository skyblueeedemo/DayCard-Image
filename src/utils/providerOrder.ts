const STORAGE_KEY = 'daycard-provider-order';

export function loadOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function saveOrder(order: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // ignore
  }
}

// ─── 模型排序 ─────────────────────────────────────

function modelOrderKey(providerId: string): string {
  return `daycard-model-order-${providerId}`;
}

export function loadModelOrder(providerId: string): string[] {
  try {
    const raw = localStorage.getItem(modelOrderKey(providerId));
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function saveModelOrder(providerId: string, order: string[]): void {
  try {
    localStorage.setItem(modelOrderKey(providerId), JSON.stringify(order));
  } catch {
    // ignore
  }
}

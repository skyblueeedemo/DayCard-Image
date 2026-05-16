import sharp from 'sharp';

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const MIN_DIMENSION = 256;
const MIN_SIZE_BYTES = 1024;

async function validateImageResult(result: Record<string, unknown>): Promise<ValidationResult> {
  const url = result.url as string | undefined;
  if (!url) {
    return { valid: false, reason: '结果中无图像 URL' };
  }

  try {
    const buffer = await fetchImageBuffer(url);
    if (!buffer) {
      return { valid: false, reason: '无法下载图像' };
    }

    if (buffer.length < MIN_SIZE_BYTES) {
      return { valid: false, reason: `图像文件过小 (${buffer.length} bytes)` };
    }

    try {
      const metadata = await sharp(buffer).metadata();
      const width = metadata.width ?? 0;
      const height = metadata.height ?? 0;

      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        return { valid: false, reason: `图像尺寸过小 (${width}x${height})` };
      }
    } catch {
      return { valid: false, reason: '无法解析图像格式' };
    }

    return { valid: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : '校验异常';
    return { valid: false, reason: message };
  }
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  // data: URL — 直接解码
  if (url.startsWith('data:')) {
    const base64Match = url.match(/^data:image\/[^;]+;base64,(.+)$/);
    if (base64Match) {
      return Buffer.from(base64Match[1], 'base64');
    }
    return null;
  }

  // 远程 URL — HEAD 检查可达性后下载
  try {
    const headRes = await fetch(url, { method: 'HEAD' });
    if (!headRes.ok) {
      return null;
    }
    const contentType = headRes.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

export { validateImageResult };
export type { ValidationResult };

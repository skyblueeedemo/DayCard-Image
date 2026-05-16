import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

function getStorePath(name: string): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, `${name}.json`);
}

function readStore<T>(name: string, defaults: T): T {
  const filePath = getStorePath(name);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return { ...defaults, ...JSON.parse(raw) } as T;
  } catch {
    return defaults;
  }
}

function writeStore<T>(name: string, data: T): void {
  const filePath = getStorePath(name);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export { readStore, writeStore };

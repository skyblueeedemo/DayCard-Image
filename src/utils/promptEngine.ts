import styles from '@/prompts/styleLibrary.json';
import scenes from '@/prompts/sceneLibrary.json';
import compositions from '@/prompts/compositionLibrary.json';

export interface WordEntry {
  id: string;
  name: string;
  prompt: string;
}

export interface DailyPrompt {
  prompt: string;
  style: WordEntry;
  scene: WordEntry;
  composition: WordEntry;
}

function hashDate(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return this.seed / 2147483647;
  }

  weightedIndex(length: number, weights?: Map<string, number>, prefix?: string, entries?: WordEntry[]): number {
    if (!weights || !prefix || !entries) {
      return Math.floor(this.next() * length);
    }

    const weightValues = entries.map((e) => {
      const key = `${prefix}:${e.id}`;
      const w = weights.get(key);
      return 1 + (w ?? 0) * 0.5;
    });

    const totalWeight = weightValues.reduce((s, w) => s + w, 0);
    let r = this.next() * totalWeight;

    for (let i = 0; i < weightValues.length; i++) {
      r -= weightValues[i];
      if (r <= 0) return i;
    }
    return weightValues.length - 1;
  }
}

function dateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildDailyPrompt(
  date: Date = new Date(),
  weights?: Map<string, number>,
): DailyPrompt {
  return buildDailyPrompts(date, 1, weights)[0];
}

export function buildDailyPrompts(
  date: Date = new Date(),
  count: number = 3,
  weights?: Map<string, number>,
): DailyPrompt[] {
  const dateStr = dateString(date);
  const results: DailyPrompt[] = [];

  for (let i = 0; i < count; i++) {
    const variant = `:v${i}`;

    const styleSeed = hashDate(dateStr + variant + ':style');
    const styleRng = new SeededRandom(styleSeed);
    const styleIdx = styleRng.weightedIndex(styles.length, weights, 'style', styles);
    const style = styles[styleIdx];

    const sceneSeed = hashDate(dateStr + variant + ':scene');
    const sceneRng = new SeededRandom(sceneSeed);
    const sceneIdx = sceneRng.weightedIndex(scenes.length, weights, 'scene', scenes);
    const scene = scenes[sceneIdx];

    const compSeed = hashDate(dateStr + variant + ':comp');
    const compRng = new SeededRandom(compSeed);
    const compIdx = compRng.weightedIndex(compositions.length, weights, 'composition', compositions);
    const composition = compositions[compIdx];

    const prompt = `${style.prompt}, ${scene.prompt}, ${composition.prompt}, high quality, detailed, masterpiece`;

    results.push({ prompt, style, scene, composition });
  }

  return results;
}

export function getAllEntries(): {
  styles: WordEntry[];
  scenes: WordEntry[];
  compositions: WordEntry[];
} {
  return { styles, scenes, compositions };
}

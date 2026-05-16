import { buildDailyPrompt, buildDailyPrompts } from './promptEngine';

export interface Theme {
  name: string;
  description: string;
  prompt: string;
  styleId: string;
  sceneId: string;
  compositionId: string;
}

export interface DailyThemesEntry {
  date: string;
  themes: Theme[];
}

const STORAGE_KEY = 'daycard-daily-themes';

function dateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function loadHistory(): DailyThemesEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DailyThemesEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entry: DailyThemesEntry): void {
  const history = loadHistory().filter((e) => e.date !== entry.date);
  history.unshift(entry);
  // Keep last 90 days
  const trimmed = history.slice(0, 90);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

// 保留旧主题数组作为离线/降级备用
const fallbackThemes: Theme[] = [
  {
    name: '自然风光',
    description: '壮丽的山川湖海，宁静的自然画卷',
    prompt: 'a breathtaking natural landscape with golden sunlight, mountains, and a calm lake, cinematic lighting, 8k resolution',
    styleId: '', sceneId: '', compositionId: '',
  },
  {
    name: '科幻都市',
    description: '未来的城市天际线，赛博朋克美学',
    prompt: 'a futuristic cyberpunk city at night, neon lights reflecting on wet streets, flying vehicles, ultra detailed, 8k',
    styleId: '', sceneId: '', compositionId: '',
  },
  {
    name: '奇幻森林',
    description: '魔法森林中的奇幻生物与发光植物',
    prompt: 'an enchanted forest with glowing mushrooms, fairy lights, ancient trees, magical atmosphere, fantasy art style',
    styleId: '', sceneId: '', compositionId: '',
  },
  {
    name: '复古胶片',
    description: '怀旧的胶片质感，温暖的光影故事',
    prompt: 'a nostalgic scene shot on vintage film, warm tones, soft grain, golden hour light, analog photography aesthetic',
    styleId: '', sceneId: '', compositionId: '',
  },
  {
    name: '极简黑白',
    description: '极致的黑白摄影，光影与构图之美',
    prompt: 'a minimalist black and white composition, dramatic shadows, strong contrast, fine art photography',
    styleId: '', sceneId: '', compositionId: '',
  },
  {
    name: '水彩插画',
    description: '轻盈的水彩笔触，温柔的色彩渲染',
    prompt: 'a delicate watercolor illustration with soft pastel colors, dreamy atmosphere, hand-painted style on textured paper',
    styleId: '', sceneId: '', compositionId: '',
  },
  {
    name: '星空宇宙',
    description: '深邃的宇宙星云，璀璨的银河系',
    prompt: 'a stunning cosmic scene with colorful nebula, bright stars, distant galaxies, deep space, astrophotography quality, 8k',
    styleId: '', sceneId: '', compositionId: '',
  },
];

export function getTodayTheme(): Theme {
  try {
    const result = buildDailyPrompt(new Date());
    return {
      name: `${result.style.name} × ${result.scene.name}`,
      description: `${result.composition.name} 构图`,
      prompt: result.prompt,
      styleId: result.style.id,
      sceneId: result.scene.id,
      compositionId: result.composition.id,
    };
  } catch {
    const day = new Date().getDay();
    return fallbackThemes[day];
  }
}

export function getTodayThemes(): Theme[] {
  const todayStr = dateString(new Date());

  // Check if today's themes are already cached
  const history = loadHistory();
  const cached = history.find((e) => e.date === todayStr);
  if (cached && cached.themes.length > 0) {
    return cached.themes;
  }

  // Generate new themes
  try {
    const results = buildDailyPrompts(new Date(), 3);
    const themes: Theme[] = results.map((r) => ({
      name: `${r.style.name} × ${r.scene.name}`,
      description: `${r.composition.name} 构图`,
      prompt: r.prompt,
      styleId: r.style.id,
      sceneId: r.scene.id,
      compositionId: r.composition.id,
    }));

    saveHistory({ date: todayStr, themes });
    return themes;
  } catch {
    // Fallback: return 3 from fallback list
    const day = new Date().getDay();
    const t1 = fallbackThemes[day];
    const t2 = fallbackThemes[(day + 2) % 7];
    const t3 = fallbackThemes[(day + 4) % 7];
    return [t1!, t2!, t3!];
  }
}

export function getThemeHistory(): DailyThemesEntry[] {
  return loadHistory();
}

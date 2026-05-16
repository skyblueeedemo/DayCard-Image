import { buildDailyPrompt } from './promptEngine';

export interface Theme {
  name: string;
  description: string;
  prompt: string;
}

// 保留旧主题数组作为离线/降级备用
const fallbackThemes: Theme[] = [
  {
    name: '自然风光',
    description: '壮丽的山川湖海，宁静的自然画卷',
    prompt: 'a breathtaking natural landscape with golden sunlight, mountains, and a calm lake, cinematic lighting, 8k resolution',
  },
  {
    name: '科幻都市',
    description: '未来的城市天际线，赛博朋克美学',
    prompt: 'a futuristic cyberpunk city at night, neon lights reflecting on wet streets, flying vehicles, ultra detailed, 8k',
  },
  {
    name: '奇幻森林',
    description: '魔法森林中的奇幻生物与发光植物',
    prompt: 'an enchanted forest with glowing mushrooms, fairy lights, ancient trees, magical atmosphere, fantasy art style',
  },
  {
    name: '复古胶片',
    description: '怀旧的胶片质感，温暖的光影故事',
    prompt: 'a nostalgic scene shot on vintage film, warm tones, soft grain, golden hour light, analog photography aesthetic',
  },
  {
    name: '极简黑白',
    description: '极致的黑白摄影，光影与构图之美',
    prompt: 'a minimalist black and white composition, dramatic shadows, strong contrast, fine art photography',
  },
  {
    name: '水彩插画',
    description: '轻盈的水彩笔触，温柔的色彩渲染',
    prompt: 'a delicate watercolor illustration with soft pastel colors, dreamy atmosphere, hand-painted style on textured paper',
  },
  {
    name: '星空宇宙',
    description: '深邃的宇宙星云，璀璨的银河系',
    prompt: 'a stunning cosmic scene with colorful nebula, bright stars, distant galaxies, deep space, astrophotography quality, 8k',
  },
];

export function getTodayTheme(): Theme {
  try {
    const result = buildDailyPrompt(new Date());
    return {
      name: `${result.style.name} × ${result.scene.name}`,
      description: `${result.composition.name} 构图`,
      prompt: result.prompt,
    };
  } catch {
    // JSON 导入失败时降级到硬编码主题
    const day = new Date().getDay();
    return fallbackThemes[day];
  }
}

import type { DifficultyConfig, DifficultyId } from './types';

/**
 * 难度阈值集中配置。UI 与引擎都必须从这里读取，不允许在组件里重复定义。
 *
 * gap = |movieA.rating - movieB.rating|
 * 这些是初始产品参数，试玩后可以调整（见 docs/PRD.md）。
 */
export const DIFFICULTIES: readonly DifficultyConfig[] = [
  {
    id: 'normal',
    label: 'Normal',
    labelZh: '普通',
    minGap: 0.8,
    maxGap: 2.0,
    hint: '两部电影评分差 0.8–2.0，差距明显。',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    labelZh: '进阶',
    minGap: 0.3,
    maxGap: 0.7,
    hint: '两部电影评分差 0.3–0.7，需要一点印象。',
  },
  {
    id: 'expert',
    label: 'Expert',
    labelZh: '专家',
    minGap: 0.1,
    maxGap: 0.2,
    hint: '两部电影评分差 0.1–0.2，几乎全靠直觉。',
  },
];

export const DEFAULT_DIFFICULTY: DifficultyId = 'normal';

/** 按 ID 取难度配置；未知 ID 直接抛错，避免静默降级。 */
export function getDifficulty(id: DifficultyId): DifficultyConfig {
  const found = DIFFICULTIES.find((item) => item.id === id);
  if (!found) {
    throw new RangeError(`未知难度：${String(id)}`);
  }
  return found;
}

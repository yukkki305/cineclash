import type { DifficultyConfig, Movie, Question, Rng, YearRange } from './types';

/** 浮点比较容差：评分只保留一位小数，避免 0.8 - 0.7 = 0.10000000000000009 之类的误差。 */
const EPSILON = 1e-9;

/** 评分范围的合法性约束（0–10 分制）。 */
export const MIN_RATING = 0;
export const MAX_RATING = 10;

/** 年份的合法性约束。 */
export const MIN_YEAR = 1888;

/** 无序配对键：与左右位置无关，用于本局内去重。 */
export function pairKey(a: Movie, b: Movie): string {
  return a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
}

/** 评分差的绝对值，四舍五入到三位小数以消除浮点噪声。 */
export function ratingGap(a: Movie, b: Movie): number {
  return Math.round(Math.abs(a.rating - b.rating) * 1000) / 1000;
}

/** 评分是否为可用于比较的有限数值（数值比较，不做字符串比较）。 */
export function hasComparableRating(movie: Movie): boolean {
  return typeof movie.rating === 'number' && Number.isFinite(movie.rating);
}

/** 年份是否落在闭区间内。 */
export function isInYearRange(movie: Movie, range: YearRange): boolean {
  return movie.year >= range.from && movie.year <= range.to;
}

/**
 * 判断两部电影能否组成一道合法题目的候选配对。
 *
 * 规则覆盖：ID 必须不同（规则 9）、评分相同不得出题（规则 10）、
 * 双方都要满足年份范围（规则 11）、评分差必须落在当前难度区间内。
 */
export function isLegalPair(
  a: Movie,
  b: Movie,
  difficulty: DifficultyConfig,
  yearRange: YearRange,
): boolean {
  if (a.id === b.id) return false;
  if (!hasComparableRating(a) || !hasComparableRating(b)) return false;
  if (!isInYearRange(a, yearRange) || !isInYearRange(b, yearRange)) return false;

  const gap = ratingGap(a, b);
  if (gap <= 0) return false;
  return gap >= difficulty.minGap - EPSILON && gap <= difficulty.maxGap + EPSILON;
}

export interface CandidatePair {
  readonly a: Movie;
  readonly b: Movie;
  readonly key: string;
  readonly gap: number;
}

/**
 * 枚举所有合法配对，按 key 排序以保证结果稳定（便于测试与复现）。
 *
 * 复杂度为 O(n²)，片库规模在几百部时完全够用；片库继续变大再做索引优化。
 */
export function collectLegalPairs(
  movies: readonly Movie[],
  difficulty: DifficultyConfig,
  yearRange: YearRange,
): CandidatePair[] {
  const pairs: CandidatePair[] = [];
  for (let i = 0; i < movies.length; i += 1) {
    const a = movies[i];
    if (!a) continue;
    for (let j = i + 1; j < movies.length; j += 1) {
      const b = movies[j];
      if (!b) continue;
      if (!isLegalPair(a, b, difficulty, yearRange)) continue;
      pairs.push({ a, b, key: pairKey(a, b), gap: ratingGap(a, b) });
    }
  }
  return pairs.sort((left, right) => (left.key < right.key ? -1 : left.key > right.key ? 1 : 0));
}

export interface SelectQuestionOptions {
  readonly difficulty: DifficultyConfig;
  readonly yearRange: YearRange;
  /** 本局已经用过的配对键。 */
  readonly usedPairs?: Iterable<string>;
}

/**
 * 抽一道题。
 *
 * - 优先从未使用过的合法配对中抽取（规则 15）。
 * - 只有当未使用的配对全部耗尽时，才允许重复使用旧配对。
 * - 一个合法配对都不存在时返回 null，由调用方安全结束（规则 13）。
 * - 左右位置由随机源决定，避免系统性偏向高分电影（规则 14）。
 */
export function selectQuestion(
  movies: readonly Movie[],
  options: SelectQuestionOptions,
  rng: Rng,
): Question | null {
  const { difficulty, yearRange } = options;
  const used = new Set(options.usedPairs ?? []);
  const all = collectLegalPairs(movies, difficulty, yearRange);
  if (all.length === 0) return null;

  const unused = all.filter((pair) => !used.has(pair.key));
  const pool = unused.length > 0 ? unused : all;

  const index = Math.min(pool.length - 1, Math.floor(normalize(rng()) * pool.length));
  const picked = pool[index];
  if (!picked) return null;

  const swap = normalize(rng()) < 0.5;
  const left = swap ? picked.b : picked.a;
  const right = swap ? picked.a : picked.b;

  // 评分相同已在 isLegalPair 中排除，这里的比较不会出现平局。
  const correctId = left.rating > right.rating ? left.id : right.id;
  return { a: left, b: right, correctId, pairKey: picked.key };
}

/** 把任意随机数归一化到 [0, 1)，防止注入的随机源返回越界值。 */
function normalize(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 0.999999999;
  return value;
}

import { MAX_RATING, MIN_RATING, MIN_YEAR } from '../game/question';
import type { Movie } from '../game/types';

/** 校验问题代码，便于测试与日志定位。 */
export type ValidationCode =
  | 'duplicate-id'
  | 'duplicate-record'
  | 'empty-title'
  | 'invalid-year'
  | 'invalid-rating'
  | 'missing-rating-source'
  | 'invalid-poster-url';

export interface ValidationIssue {
  readonly code: ValidationCode;
  readonly message: string;
  /** 出问题记录的 id，便于定位。 */
  readonly movieId?: string;
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly issues: readonly ValidationIssue[];
  /** 通过校验的记录（重复项只保留第一条）。 */
  readonly valid: readonly Movie[];
}

/** 允许的最新上映年份：当前年份 + 5（容忍已定档的未上映作品）。 */
export function latestAllowedYear(now: Date = new Date()): number {
  return now.getFullYear() + 5;
}

/**
 * 校验电影数据（数据政策要求「被游戏使用前必须校验」）。
 *
 * 检查项：重复 ID、重复记录、空标题、非法年份、非有限或越界评分、
 * 缺失或含义不明的评分来源、非法海报地址。
 * 有问题的记录会被剔除，但整体结果仍如实报告所有问题，绝不静默吞掉。
 */
export function validateMovies(
  input: readonly Movie[],
  now: Date = new Date(),
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const valid: Movie[] = [];
  const seenIds = new Set<string>();
  const seenRecords = new Map<string, string>();
  const maxYear = latestAllowedYear(now);

  for (const movie of input) {
    const problems: ValidationIssue[] = [];

    if (typeof movie.id !== 'string' || movie.id.trim() === '') {
      problems.push({ code: 'duplicate-id', message: '缺少可用的稳定 ID' });
    } else if (seenIds.has(movie.id)) {
      problems.push({ code: 'duplicate-id', message: `ID 重复：${movie.id}` });
    }

    if (typeof movie.title !== 'string' || movie.title.trim() === '') {
      problems.push({ code: 'empty-title', message: '片名为空', movieId: movie.id });
    }

    if (
      typeof movie.year !== 'number' ||
      !Number.isInteger(movie.year) ||
      movie.year < MIN_YEAR ||
      movie.year > maxYear
    ) {
      problems.push({
        code: 'invalid-year',
        message: `年份非法：${String(movie.year)}（应在 ${MIN_YEAR}–${maxYear} 之间）`,
        movieId: movie.id,
      });
    }

    if (
      typeof movie.rating !== 'number' ||
      !Number.isFinite(movie.rating) ||
      movie.rating < MIN_RATING ||
      movie.rating > MAX_RATING
    ) {
      problems.push({
        code: 'invalid-rating',
        message: `评分非法：${String(movie.rating)}（应为 ${MIN_RATING}–${MAX_RATING} 的有限数值）`,
        movieId: movie.id,
      });
    }

    if (
      typeof movie.ratingSource !== 'string' ||
      movie.ratingSource.trim().length < 2
    ) {
      problems.push({
        code: 'missing-rating-source',
        message: '缺少评分来源或来源含义不明',
        movieId: movie.id,
      });
    }

    if (
      movie.posterUrl !== undefined &&
      (typeof movie.posterUrl !== 'string' || movie.posterUrl.trim() === '')
    ) {
      problems.push({
        code: 'invalid-poster-url',
        message: '海报地址非法',
        movieId: movie.id,
      });
    }

    // 重复记录：片名 + 年份 + 评分完全相同但 ID 不同，视为同一部片被录入两次。
    const recordKey = `${movie.title?.trim() ?? ''}|${String(movie.year)}|${String(movie.rating)}`;
    if (problems.length === 0 && seenRecords.has(recordKey)) {
      problems.push({
        code: 'duplicate-record',
        message: `重复记录：与 ${seenRecords.get(recordKey)} 的片名/年份/评分完全相同`,
        movieId: movie.id,
      });
    }

    if (problems.length > 0) {
      issues.push(...problems);
      continue;
    }

    seenIds.add(movie.id);
    seenRecords.set(recordKey, movie.id);
    valid.push(movie);
  }

  return { ok: issues.length === 0, issues, valid };
}

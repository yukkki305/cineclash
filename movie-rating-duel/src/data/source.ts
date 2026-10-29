import type { Movie, YearRange } from '../game/types';
import { validateMovies } from './validate';

/**
 * 数据源适配器。
 *
 * UI 与引擎只依赖这个接口，不直接依赖具体的片库文件，
 * 因此未来换成真实数据源时不需要重写游戏逻辑（见 docs/ARCHITECTURE.md）。
 */
export interface MovieSource {
  readonly name: string;
  /** 关于数据性质的说明，UI 必须展示，避免把合成数据误认为真实评分。 */
  readonly disclaimer: string;
  readonly movies: readonly Movie[];
  /** 数据实际覆盖的年份范围。 */
  readonly yearRange: YearRange;
}

export interface CreateMovieSourceInput {
  readonly name: string;
  readonly disclaimer: string;
  readonly movies: readonly Movie[];
}

/** 校验失败时的错误：明确列出所有问题，不静默丢弃数据。 */
export class MovieDataError extends Error {
  constructor(
    readonly issues: readonly string[],
  ) {
    super(`电影数据校验失败（${issues.length} 项）：\n${issues.join('\n')}`);
    this.name = 'MovieDataError';
  }
}

/**
 * 创建数据源。构造时立即校验，任何一条记录非法都会抛错。
 *
 * 这是「数据必须在被游戏使用前校验」的落地位置：宁可启动失败，
 * 也不要让脏数据悄悄进入游戏。
 */
export function createMovieSource(input: CreateMovieSourceInput): MovieSource {
  const result = validateMovies(input.movies);
  if (!result.ok) {
    throw new MovieDataError(
      result.issues.map((issue) => `[${issue.code}] ${issue.message}`),
    );
  }
  if (result.valid.length === 0) {
    throw new MovieDataError(['片库为空']);
  }

  const years = result.valid.map((movie) => movie.year);
  return {
    name: input.name,
    disclaimer: input.disclaimer,
    movies: result.valid,
    yearRange: { from: Math.min(...years), to: Math.max(...years) },
  };
}

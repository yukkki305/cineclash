import type { Movie, Rng } from '../game/types';

/** 测试用电影：评分 8.0 / 7.0，评分差 1.0，落在普通难度区间。 */
export const MOVIE_HIGH: Movie = {
  id: 'a',
  title: '高分片',
  year: 2020,
  rating: 8.0,
  ratingSource: '测试数据',
};

export const MOVIE_LOW: Movie = {
  id: 'b',
  title: '低分片',
  year: 2018,
  rating: 7.0,
  ratingSource: '测试数据',
};

export const MOVIE_OLD: Movie = {
  id: 'c',
  title: '老片',
  year: 1990,
  rating: 3.0,
  ratingSource: '测试数据',
};

export const TWO_MOVIES: readonly Movie[] = [MOVIE_HIGH, MOVIE_LOW];

/** 按给定序列循环输出的确定性随机源。 */
export function seqRng(values: readonly number[]): Rng {
  let index = 0;
  return () => {
    const value = values[Math.min(index, values.length - 1)] ?? 0;
    index += 1;
    return value;
  };
}

/** 始终返回同一个值的确定性随机源。 */
export function constantRng(value = 0): Rng {
  return () => value;
}

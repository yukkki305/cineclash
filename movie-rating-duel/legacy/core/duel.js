/**
 * 对决配对：从片库中挑出一对电影。
 *
 * 纯函数模块 —— 随机源通过 options.rng 注入，默认值仅为便利，
 * 测试中一律显式传入 mulberry32(seed)。
 */

import { DEFAULT_RATING } from './elo.js';

/** 支持的配对策略。 */
export const DUEL_STRATEGIES = Object.freeze(['random', 'closest', 'widest']);

/**
 * 读取电影当前分值；缺省回退到初始分值。
 * 让 core 层不关心分值是存在对象上还是外部 Map 里。
 */
function defaultRatingOf(movie) {
  return typeof movie?.rating === 'number' ? movie.rating : DEFAULT_RATING;
}

/**
 * 从片库中选出一对不同的电影。
 *
 * 策略：
 * - `random`：均匀随机
 * - `closest`：分值最接近的一对（并列时取下标靠前的）
 * - `widest`：分值差距最大的一对（并列时取下标靠前的）
 *
 * @param {Array<object>} movies 片库，至少 2 部
 * @param {{ strategy?: 'random'|'closest'|'widest', rng?: () => number, ratingOf?: (movie: object) => number }} [options]
 * @returns {{ a: object, b: object }} 保证 a 与 b 不是同一个元素
 * @throws {RangeError} 片库不是数组、不足 2 部，或策略未知
 */
export function pickDuel(movies, options = {}) {
  const { strategy = 'random', rng = Math.random, ratingOf = defaultRatingOf } = options;

  if (!Array.isArray(movies) || movies.length < 2) {
    throw new RangeError('至少需要 2 部电影才能发起对决');
  }
  if (!DUEL_STRATEGIES.includes(strategy)) {
    throw new RangeError(`未知的配对策略: ${strategy}`);
  }

  const n = movies.length;

  if (strategy === 'random') {
    const i = Math.min(n - 1, Math.floor(rng() * n));
    const rawJ = Math.min(n - 2, Math.floor(rng() * (n - 1)));
    const j = rawJ >= i ? rawJ + 1 : rawJ;
    return { a: movies[i], b: movies[j] };
  }

  let bestI = 0;
  let bestJ = 1;
  let bestDiff = Math.abs(ratingOf(movies[0]) - ratingOf(movies[1]));

  for (let i = 0; i < n; i += 1) {
    const ri = ratingOf(movies[i]);
    for (let j = i + 1; j < n; j += 1) {
      const diff = Math.abs(ri - ratingOf(movies[j]));
      const better = strategy === 'closest' ? diff < bestDiff : diff > bestDiff;
      if (better) {
        bestI = i;
        bestJ = j;
        bestDiff = diff;
      }
    }
  }

  return { a: movies[bestI], b: movies[bestJ] };
}

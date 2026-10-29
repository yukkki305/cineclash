/**
 * Elo 评分核心：期望胜率与分值更新。
 *
 * 纯函数模块 —— 不读写全局状态、不做 IO、不依赖时间与随机源。
 * 公式与约定见 docs/ARCHITECTURE.md 第 3 节。
 */

/** 默认学习率 K。越大收敛越快，也越容易被单场结果带偏。 */
export const DEFAULT_K = 32;

/** 新电影的初始分值。 */
export const DEFAULT_RATING = 1000;

/** 分值下限，防止连败后跌入无意义的负区间。 */
export const MIN_RATING = 100;

/** 合法的得分集合：胜 / 平 / 负。 */
export const VALID_SCORES = Object.freeze([0, 0.5, 1]);

/**
 * 计算 A 对 B 的期望胜率。
 *
 * E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 *
 * @param {number} ratingA A 的分值
 * @param {number} ratingB B 的分值
 * @returns {number} A 的期望得分，区间 (0, 1)
 * @throws {TypeError} 任一分值不是有限数
 */
export function expectedScore(ratingA, ratingB) {
  if (!Number.isFinite(ratingA) || !Number.isFinite(ratingB)) {
    throw new TypeError('分值必须是有限数');
  }
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

/**
 * 按单场对决结果更新双方分值。
 *
 * R_A' = R_A + K * (S_A - E_A)
 * R_B' = R_B - K * (S_A - E_A)
 *
 * 两侧各自取整并 clamp 到下限，因此可能出现 ±1 的零和误差（见 AGENTS.md「常见陷阱」）。
 *
 * @param {number} ratingA A 的原分值
 * @param {number} ratingB B 的原分值
 * @param {number} scoreA A 的实际得分：1 胜 / 0.5 平 / 0 负
 * @param {{ k?: number, minRating?: number }} [options]
 * @returns {{ ratingA: number, ratingB: number, deltaA: number, deltaB: number, expectedA: number }}
 * @throws {TypeError} 分值不是有限数
 * @throws {RangeError} 得分不在 {0, 0.5, 1} 中
 */
export function updateRatings(ratingA, ratingB, scoreA, options = {}) {
  const { k = DEFAULT_K, minRating = MIN_RATING } = options;

  if (!VALID_SCORES.includes(scoreA)) {
    throw new RangeError(`scoreA 必须是 0、0.5 或 1，收到 ${scoreA}`);
  }
  if (!Number.isFinite(k) || k <= 0) {
    throw new RangeError(`K 值必须是正数，收到 ${k}`);
  }

  const expectedA = expectedScore(ratingA, ratingB);
  const shift = k * (scoreA - expectedA);

  const nextA = Math.round(Math.max(minRating, ratingA + shift));
  const nextB = Math.round(Math.max(minRating, ratingB - shift));

  return {
    ratingA: nextA,
    ratingB: nextB,
    deltaA: nextA - ratingA,
    deltaB: nextB - ratingB,
    expectedA,
  };
}

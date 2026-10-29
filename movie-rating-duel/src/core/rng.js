/**
 * 可复现的伪随机数生成器（mulberry32）。
 *
 * core 层禁止直接使用 Math.random：随机源必须由调用方注入，
 * 这样测试可以固定种子、复现同一串序列。
 */

/**
 * 创建一个 32 位种子的随机数函数。
 *
 * @param {number} seed 任意整数，内部按 uint32 处理
 * @returns {() => number} 每次调用返回 [0, 1) 区间的数
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

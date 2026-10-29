import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_K,
  DEFAULT_RATING,
  MIN_RATING,
  expectedScore,
  updateRatings,
} from '../src/core/elo.js';

describe('expectedScore', () => {
  test('E-01 同分时期望胜率为 0.5', () => {
    assert.ok(Math.abs(expectedScore(1000, 1000) - 0.5) < 1e-12);
  });

  test('E-02 分值更高的一方期望胜率大于 0.5', () => {
    const value = expectedScore(1200, 1000);
    assert.ok(value > 0.5);
    assert.ok(Math.abs(value - 0.7597) < 1e-4);
  });

  test('E-03 双方期望值互补', () => {
    const pairs = [
      [1000, 1000],
      [1200, 950],
      [400, 2100],
      [1500, 1499],
    ];
    for (const [a, b] of pairs) {
      assert.ok(Math.abs(expectedScore(a, b) + expectedScore(b, a) - 1) < 1e-12);
    }
  });

  test('E-11 非有限数抛 TypeError', () => {
    assert.throws(() => expectedScore(Number.NaN, 1000), TypeError);
    assert.throws(() => expectedScore(1000, Number.POSITIVE_INFINITY), TypeError);
  });
});

describe('updateRatings', () => {
  test('E-04 胜者加分、负者减分', () => {
    const result = updateRatings(1000, 1000, 1);
    assert.ok(result.ratingA > 1000);
    assert.ok(result.ratingB < 1000);
    assert.equal(result.deltaA, DEFAULT_K / 2);
    assert.equal(result.deltaB, -DEFAULT_K / 2);
  });

  test('E-05 单场对决在容差内是零和的', () => {
    const cases = [
      [1000, 1000, 1],
      [1000, 1000, 0],
      [1350, 980, 0.5],
      [870, 1600, 1],
      [2000, 100, 0],
    ];
    for (const [a, b, score] of cases) {
      const result = updateRatings(a, b, score);
      assert.ok(Math.abs(result.deltaA + result.deltaB) <= 1, `${a} vs ${b} (${score}) 破坏了零和`);
    }
  });

  test('E-06 同分平局时双方基本不动', () => {
    const result = updateRatings(1000, 1000, 0.5);
    assert.ok(Math.abs(result.deltaA) <= 1);
    assert.ok(Math.abs(result.deltaB) <= 1);
    assert.equal(result.ratingA, 1000);
    assert.equal(result.ratingB, 1000);
  });

  test('E-07 强队获胜得到的加分更少', () => {
    const favorite = updateRatings(1400, 1000, 1);
    const even = updateRatings(1000, 1000, 1);
    assert.ok(favorite.deltaA < even.deltaA);
  });

  test('E-08 爆冷带来的加分更多', () => {
    const upset = updateRatings(1000, 1400, 1);
    const favorite = updateRatings(1400, 1000, 1);
    assert.ok(upset.deltaA > favorite.deltaA);
    assert.ok(upset.deltaA > 0);
  });

  test('E-09 分值不会跌破下限', () => {
    const result = updateRatings(100, 2000, 0);
    assert.ok(result.ratingA >= MIN_RATING);
  });

  test('E-10 非法得分抛 RangeError', () => {
    assert.throws(() => updateRatings(1000, 1000, 0.3), RangeError);
    assert.throws(() => updateRatings(1000, 1000, '1'), RangeError);
    assert.throws(() => updateRatings(1000, 1000, 2), RangeError);
  });

  test('E-12 K 值与分值变化成正比', () => {
    const half = updateRatings(1000, 1000, 1, { k: 32 });
    const full = updateRatings(1000, 1000, 1, { k: 64 });
    assert.ok(Math.abs(full.deltaA - half.deltaA * 2) <= 2);
  });

  test('E-13 交换 A/B 与交换结果后等价', () => {
    const forward = updateRatings(1200, 900, 1);
    const backward = updateRatings(900, 1200, 0);
    assert.ok(Math.abs(forward.ratingA - backward.ratingB) <= 1);
    assert.ok(Math.abs(forward.ratingB - backward.ratingA) <= 1);
  });

  test('非法 K 值抛 RangeError', () => {
    assert.throws(() => updateRatings(1000, 1000, 1, { k: 0 }), RangeError);
    assert.throws(() => updateRatings(1000, 1000, 1, { k: -16 }), RangeError);
  });

  test('默认参数与常量一致', () => {
    assert.equal(DEFAULT_K, 32);
    assert.equal(DEFAULT_RATING, 1000);
    assert.equal(MIN_RATING, 100);
  });
});

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { mulberry32 } from '../src/core/rng.js';

describe('mulberry32', () => {
  test('R-01 输出始终落在 [0, 1)', () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 5000; i += 1) {
      const value = rng();
      assert.ok(value >= 0 && value < 1, `越界: ${value}`);
    }
  });

  test('R-02 同种子产生完全相同的序列', () => {
    const left = mulberry32(999);
    const right = mulberry32(999);
    for (let i = 0; i < 100; i += 1) {
      assert.equal(left(), right());
    }
  });

  test('R-03 分布均值接近 0.5', () => {
    const rng = mulberry32(2024);
    let sum = 0;
    const rounds = 10000;
    for (let i = 0; i < rounds; i += 1) {
      sum += rng();
    }
    const mean = sum / rounds;
    assert.ok(mean > 0.45 && mean < 0.55, `均值偏移: ${mean}`);
  });

  test('不同种子产生不同序列', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    let differences = 0;
    for (let i = 0; i < 20; i += 1) {
      if (a() !== b()) differences += 1;
    }
    assert.ok(differences > 0);
  });

  test('种子按 uint32 归一化', () => {
    const left = mulberry32(7);
    const right = mulberry32(7 + 2 ** 32);
    assert.equal(left(), right());
  });
});

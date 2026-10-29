import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { DUEL_STRATEGIES, pickDuel } from '../core/duel.js';
import { mulberry32 } from '../core/rng.js';
import { MOVIES } from '../data/movies.js';

function randomDuel(seed) {
  return pickDuel(MOVIES, { rng: mulberry32(seed) });
}

describe('pickDuel 参数校验', () => {
  test('D-01 片库不足 2 部时抛 RangeError', () => {
    assert.throws(() => pickDuel([MOVIES[0]]), RangeError);
    assert.throws(() => pickDuel([]), RangeError);
  });

  test('D-02 非数组输入抛 RangeError', () => {
    assert.throws(() => pickDuel(null), RangeError);
    assert.throws(() => pickDuel({ length: 3 }), RangeError);
  });

  test('D-08 未知策略抛 RangeError', () => {
    assert.throws(() => pickDuel(MOVIES, { strategy: 'unknown' }), RangeError);
  });

  test('导出的策略列表与文档一致', () => {
    assert.deepEqual([...DUEL_STRATEGIES], ['random', 'closest', 'widest']);
  });
});

describe('pickDuel · random', () => {
  test('D-03 任何种子下都不会选中同一部电影', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const { a, b } = randomDuel(seed);
      assert.notEqual(a.id, b.id, `seed=${seed} 出现自配对`);
    }
  });

  test('D-04 同一种子可复现', () => {
    const first = randomDuel(42);
    const second = randomDuel(42);
    assert.equal(first.a.id, second.a.id);
    assert.equal(first.b.id, second.b.id);
  });

  test('D-05 不同种子会产生不同序列', () => {
    const left = Array.from({ length: 5 }, (_, i) => {
      const { a, b } = randomDuel(1 + i);
      return `${a.id}|${b.id}`;
    }).join(',');
    const right = Array.from({ length: 5 }, (_, i) => {
      const { a, b } = randomDuel(1001 + i);
      return `${a.id}|${b.id}`;
    }).join(',');
    assert.notEqual(left, right);
  });

  test('长时间抽取能覆盖大部分片库', () => {
    const rng = mulberry32(7);
    const seen = new Set();
    for (let i = 0; i < 500; i += 1) {
      const { a, b } = pickDuel(MOVIES, { rng });
      seen.add(a.id);
      seen.add(b.id);
    }
    assert.equal(seen.size, MOVIES.length);
  });
});

describe('pickDuel · 确定性策略', () => {
  const rated = [
    { id: 'a', rating: 1000 },
    { id: 'b', rating: 1002 },
    { id: 'c', rating: 1500 },
  ];

  test('D-06 closest 选中分值最接近的一对', () => {
    const { a, b } = pickDuel(rated, { strategy: 'closest' });
    assert.deepEqual([a.id, b.id].sort(), ['a', 'b']);
  });

  test('D-07 widest 选中分值差距最大的一对', () => {
    const { a, b } = pickDuel(rated, { strategy: 'widest' });
    const ids = [a.id, b.id];
    assert.ok(ids.includes('a') && ids.includes('c'));
  });

  test('D-09 ratingOf 注入生效', () => {
    const bare = [{ id: 'x' }, { id: 'y' }, { id: 'z' }];
    const scores = new Map([
      ['x', 900],
      ['y', 901],
      ['z', 1400],
    ]);
    const { a, b } = pickDuel(bare, { strategy: 'closest', ratingOf: (m) => scores.get(m.id) });
    assert.deepEqual([a.id, b.id].sort(), ['x', 'y']);
  });

  test('缺少 rating 字段时回退到初始分值', () => {
    const bare = [{ id: 'x' }, { id: 'y' }, { id: 'z' }];
    const { a, b } = pickDuel(bare, { strategy: 'closest' });
    assert.deepEqual([a.id, b.id].sort(), ['x', 'y']);
  });

  test('并列时取下标靠前的一对', () => {
    const tied = [
      { id: 'p1', rating: 1000 },
      { id: 'p2', rating: 1000 },
      { id: 'p3', rating: 1000 },
    ];
    const { a, b } = pickDuel(tied, { strategy: 'widest' });
    assert.deepEqual([a.id, b.id], ['p1', 'p2']);
  });
});

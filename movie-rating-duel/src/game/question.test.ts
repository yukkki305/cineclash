import { describe, expect, it } from 'vitest';
import { getDifficulty } from './difficulty';
import {
  collectLegalPairs,
  isLegalPair,
  pairKey,
  ratingGap,
  selectQuestion,
} from './question';
import type { Movie } from './types';
import { MOVIE_HIGH, MOVIE_LOW, MOVIE_OLD, TWO_MOVIES, constantRng, seqRng } from '../test/fixtures';

const NORMAL = getDifficulty('normal');
const ADVANCED = getDifficulty('advanced');
const EXPERT = getDifficulty('expert');
const FULL_RANGE = { from: 1900, to: 2030 };

function movie(id: string, rating: number, year = 2020): Movie {
  return { id, title: `片${id}`, year, rating, ratingSource: '测试数据' };
}

describe('pairKey', () => {
  it('与左右顺序无关', () => {
    expect(pairKey(MOVIE_HIGH, MOVIE_LOW)).toBe(pairKey(MOVIE_LOW, MOVIE_HIGH));
  });
});

describe('ratingGap', () => {
  it('返回绝对值并消除浮点噪声', () => {
    expect(ratingGap(movie('x', 8.6), movie('y', 8.1))).toBe(0.5);
    expect(ratingGap(movie('x', 7.1), movie('y', 7.0))).toBe(0.1);
    expect(ratingGap(MOVIE_LOW, MOVIE_HIGH)).toBe(1);
  });
});

describe('isLegalPair', () => {
  it('评分差在难度区间内的配对合法', () => {
    expect(isLegalPair(MOVIE_HIGH, MOVIE_LOW, NORMAL, FULL_RANGE)).toBe(true);
  });

  it('包含了区间端点', () => {
    expect(isLegalPair(movie('x', 8.8), movie('y', 8.0), NORMAL, FULL_RANGE)).toBe(true);
    expect(isLegalPair(movie('x', 10), movie('y', 8), NORMAL, FULL_RANGE)).toBe(true);
    expect(isLegalPair(movie('x', 3.3), movie('y', 3.1), EXPERT, FULL_RANGE)).toBe(true);
  });

  it('低于或高于区间都不合法', () => {
    expect(isLegalPair(movie('x', 7.79), movie('y', 7.0), NORMAL, FULL_RANGE)).toBe(false);
    expect(isLegalPair(movie('x', 10), movie('y', 7.9), NORMAL, FULL_RANGE)).toBe(false);
  });

  it('评分相同的不能作为普通题目（规则 10）', () => {
    expect(isLegalPair(movie('x', 8), movie('y', 8), EXPERT, FULL_RANGE)).toBe(false);
  });

  it('同一部电影的 ID 不能自配对（规则 9）', () => {
    expect(isLegalPair(MOVIE_HIGH, { ...MOVIE_HIGH }, NORMAL, FULL_RANGE)).toBe(false);
  });

  it('年份超出筛选范围时不合法（规则 11）', () => {
    expect(isLegalPair(MOVIE_OLD, MOVIE_HIGH, NORMAL, { from: 2000, to: 2030 })).toBe(false);
  });

  it('评分不是有限数值时不合法', () => {
    expect(isLegalPair(movie('x', Number.NaN), MOVIE_LOW, NORMAL, FULL_RANGE)).toBe(false);
    expect(isLegalPair(movie('x', Number.POSITIVE_INFINITY), MOVIE_LOW, NORMAL, FULL_RANGE)).toBe(
      false,
    );
  });
});

describe('collectLegalPairs', () => {
  it('按 key 稳定排序', () => {
    const pairs = collectLegalPairs(TWO_MOVIES, NORMAL, FULL_RANGE);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]?.key).toBe('a|b');
  });

  it('没有合法配对时返回空数组', () => {
    expect(collectLegalPairs([MOVIE_HIGH], NORMAL, FULL_RANGE)).toHaveLength(0);
    expect(collectLegalPairs([], NORMAL, FULL_RANGE)).toHaveLength(0);
  });

  it('进阶与专家难度只保留窄区间的配对', () => {
    const movies = [movie('p', 8.5), movie('q', 8.2), movie('r', 8.0)];
    // 8.5-8.2=0.3（进阶下限）、8.5-8.0=0.5、8.2-8.0=0.2（专家区间）
    expect(collectLegalPairs(movies, ADVANCED, FULL_RANGE).map((p) => p.key)).toEqual([
      'p|q',
      'p|r',
    ]);
    expect(collectLegalPairs(movies, EXPERT, FULL_RANGE).map((p) => p.key)).toEqual(['q|r']);
  });
});

describe('selectQuestion', () => {
  const options = { difficulty: NORMAL, yearRange: FULL_RANGE };

  it('没有合法配对时返回 null（规则 13）', () => {
    expect(selectQuestion([MOVIE_HIGH], options, constantRng(0))).toBeNull();
  });

  it('把评分更高的一部标记为正确答案', () => {
    const question = selectQuestion(TWO_MOVIES, options, constantRng(0));
    expect(question).not.toBeNull();
    expect(question?.correctId).toBe(MOVIE_HIGH.id);
  });

  it('返回的 pairKey 与左右顺序无关', () => {
    const question = selectQuestion(TWO_MOVIES, options, constantRng(0.9));
    expect(question?.pairKey).toBe('a|b');
  });

  it('左右位置由随机源决定，不会系统性偏向高分片（规则 14）', () => {
    const noSwap = selectQuestion(TWO_MOVIES, options, seqRng([0, 0.9]));
    const swapped = selectQuestion(TWO_MOVIES, options, seqRng([0, 0.1]));
    expect(noSwap?.a.id).toBe(MOVIE_HIGH.id);
    expect(swapped?.a.id).toBe(MOVIE_LOW.id);
    expect(noSwap?.correctId).toBe(MOVIE_HIGH.id);
    expect(swapped?.correctId).toBe(MOVIE_HIGH.id);
  });

  it('优先使用未出现过的配对付（规则 15）', () => {
    const question = selectQuestion(TWO_MOVIES, { ...options, usedPairs: ['a|b'] }, constantRng(0));
    // 只有一个合法配对，耗尽后允许复用，但不能返回 null
    expect(question?.pairKey).toBe('a|b');

    const movies = [movie('x', 8.0), movie('y', 7.0), movie('z', 6.0)];
    const fresh = selectQuestion(movies, { ...options, usedPairs: ['x|y'] }, constantRng(0));
    expect(fresh?.pairKey).toBe('x|z');
  });

  it('耗尽后复用已有配对而不是报错', () => {
    const movies = [movie('x', 8.0), movie('y', 7.0)];
    const used = ['x|y'];
    expect(selectQuestion(movies, { ...options, usedPairs: used }, constantRng(0.5))).not.toBeNull();
  });

  it('非法随机源不会产生越界下标', () => {
    expect(selectQuestion(TWO_MOVIES, options, constantRng(Number.NaN))).not.toBeNull();
    expect(selectQuestion(TWO_MOVIES, options, constantRng(42))).not.toBeNull();
    expect(selectQuestion(TWO_MOVIES, options, constantRng(-3))).not.toBeNull();
  });
});

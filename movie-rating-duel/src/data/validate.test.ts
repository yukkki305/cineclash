import { describe, expect, it } from 'vitest';
import type { Movie } from '../game/types';
import { MovieDataError, createMovieSource } from './source';
import { latestAllowedYear, validateMovies } from './validate';

const NOW = new Date('2025-06-01T00:00:00Z');

function movie(overrides: Partial<Movie> = {}): Movie {
  return {
    id: 'x',
    title: '片名',
    year: 2020,
    rating: 8.0,
    ratingSource: '测试数据',
    ...overrides,
  };
}

describe('validateMovies', () => {
  it('合法数据通过校验', () => {
    const result = validateMovies([movie({ id: 'a' }), movie({ id: 'b', title: '另一部' })], NOW);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.valid).toHaveLength(2);
  });

  it('重复 ID 被拒绝', () => {
    const result = validateMovies(
      [movie({ id: 'a' }), movie({ id: 'a', title: '另一部' })],
      NOW,
    );
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('duplicate-id');
    expect(result.valid).toHaveLength(1);
  });

  it('片名相同、年份与评分相同的重复记录被拒绝', () => {
    const result = validateMovies([movie({ id: 'a' }), movie({ id: 'b' })], NOW);
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('duplicate-record');
  });

  it('空片名被拒绝', () => {
    const result = validateMovies([movie({ title: '   ' })], NOW);
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('empty-title');
  });

  it('非法年份被拒绝', () => {
    const cases = [1800, 2020.5, Number.NaN, latestAllowedYear(NOW) + 1];
    for (const year of cases) {
      const result = validateMovies([movie({ year })], NOW);
      expect(result.ok).toBe(false);
      expect(result.issues.map((issue) => issue.code)).toContain('invalid-year');
    }
  });

  it('非有限或越界的评分被拒绝', () => {
    const cases = [Number.NaN, Number.POSITIVE_INFINITY, -0.1, 10.1];
    for (const rating of cases) {
      const result = validateMovies([movie({ rating })], NOW);
      expect(result.ok).toBe(false);
      expect(result.issues.map((issue) => issue.code)).toContain('invalid-rating');
    }
  });

  it('缺失或含义不明的评分来源被拒绝', () => {
    const cases = ['', ' ', 'x'];
    for (const ratingSource of cases) {
      const result = validateMovies([movie({ ratingSource })], NOW);
      expect(result.ok).toBe(false);
      expect(result.issues.map((issue) => issue.code)).toContain('missing-rating-source');
    }
  });

  it('非法海报地址被拒绝', () => {
    const result = validateMovies([movie({ posterUrl: '  ' })], NOW);
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('invalid-poster-url');
  });

  it('问题记录被剔除，其余记录仍然可用', () => {
    const result = validateMovies(
      [movie({ id: 'ok' }), movie({ id: 'bad', rating: 99 })],
      NOW,
    );
    expect(result.valid.map((item) => item.id)).toEqual(['ok']);
    expect(result.issues).toHaveLength(1);
  });
});

describe('createMovieSource', () => {
  it('构造时校验并计算年份范围', () => {
    const source = createMovieSource({
      name: 'test',
      disclaimer: '免责声明',
      movies: [movie({ id: 'a', year: 2001 }), movie({ id: 'b', title: '乙', year: 2019 })],
    });
    expect(source.movies).toHaveLength(2);
    expect(source.yearRange).toEqual({ from: 2001, to: 2019 });
  });

  it('数据非法时抛错而不是静默丢弃', () => {
    expect(() =>
      createMovieSource({
        name: 'test',
        disclaimer: '免责声明',
        movies: [movie({ rating: Number.NaN })],
      }),
    ).toThrow(MovieDataError);
  });

  it('空片库抛错', () => {
    expect(() =>
      createMovieSource({ name: 'test', disclaimer: '免责声明', movies: [] }),
    ).toThrow(MovieDataError);
  });
});

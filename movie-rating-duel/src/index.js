/**
 * 演示入口：用固定的种子模拟 60 场对决，然后打印排行榜。
 *
 * 这里承担所有「副作用编排」（随机源、计时、打印），
 * core 层保持纯函数 —— 见 docs/ARCHITECTURE.md ADR-002。
 */

import { DEFAULT_RATING, updateRatings } from './core/elo.js';
import { pickDuel } from './core/duel.js';
import { mulberry32 } from './core/rng.js';
import { MOVIES } from './data/movies.js';

const SEED = Number.parseInt(process.env.MRD_SEED ?? '20240601', 10);
const TOTAL_DUELS = 60;

// 人造口味：片库顺序线性递减的「真实偏好」。
// 只用于验证算法能否把偏好还原出来，不代表任何产品判断。
const taste = new Map(MOVIES.map((movie, index) => [movie.id, 1 - index / MOVIES.length]));

const rng = mulberry32(SEED);
const ratings = new Map(MOVIES.map((movie) => [movie.id, DEFAULT_RATING]));
const duelCounts = new Map(MOVIES.map((movie) => [movie.id, 0]));

for (let round = 0; round < TOTAL_DUELS; round += 1) {
  const { a, b } = pickDuel(MOVIES, { rng });

  // 用 logistic 把口味差映射为胜率，再按胜率抽样胜者
  const probabilityA = 1 / (1 + Math.exp(-6 * (taste.get(a.id) - taste.get(b.id))));
  const scoreA = rng() < probabilityA ? 1 : 0;

  const next = updateRatings(ratings.get(a.id), ratings.get(b.id), scoreA);
  ratings.set(a.id, next.ratingA);
  ratings.set(b.id, next.ratingB);
  duelCounts.set(a.id, duelCounts.get(a.id) + 1);
  duelCounts.set(b.id, duelCounts.get(b.id) + 1);
}

const ranked = MOVIES.map((movie) => ({
  ...movie,
  rating: ratings.get(movie.id),
  duels: duelCounts.get(movie.id),
})).sort((x, y) => y.rating - x.rating || x.title.localeCompare(y.title, 'zh'));

/** 近似显示宽度：CJK 字符按 2 列计算，便于等宽对齐 */
function displayWidth(text) {
  let width = 0;
  for (const char of String(text)) {
    width += char.codePointAt(0) > 0x2e80 ? 2 : 1;
  }
  return width;
}

/** 按显示宽度右侧补空格 */
function padEndWide(text, width) {
  return String(text) + ' '.repeat(Math.max(0, width - displayWidth(text)));
}

const columns = { rank: 3, title: 30, year: 6, rating: 6, delta: 7, duels: 5 };
const tableWidth = Object.values(columns).reduce((sum, width) => sum + width, 0);

function renderRow(rank, title, year, rating, delta, duels) {
  const deltaText = delta > 0 ? `+${delta}` : String(delta);
  return [
    padEndWide(rank, columns.rank),
    padEndWide(title, columns.title),
    padEndWide(year, columns.year),
    padEndWide(rating, columns.rating),
    padEndWide(deltaText, columns.delta),
    padEndWide(duels, columns.duels),
  ].join('');
}

console.log(`movie-rating-duel · seed=${SEED} · ${TOTAL_DUELS} 场对决 · 共 ${MOVIES.length} 部电影\n`);
console.log(renderRow('#', '电影', '年份', '分值', 'Δ', '场次'));
console.log('-'.repeat(tableWidth));

ranked.forEach((movie, index) => {
  console.log(
    renderRow(
      index + 1,
      movie.title,
      movie.year,
      movie.rating,
      movie.rating - DEFAULT_RATING,
      movie.duels,
    ),
  );
});

console.log(`\n榜单前 3 名：${ranked.slice(0, 3).map((m) => m.title).join(' > ')}`);

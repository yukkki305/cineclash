/**
 * 种子片库（12 部）。
 *
 * 只放静态数据，不含任何业务逻辑。
 * 扩展计划见 docs/TASKS.md「已知技术债」：M1 前扩到 ≥ 60 部，按题材分层。
 */

/**
 * @typedef {object} Movie
 * @property {string} id 稳定唯一标识
 * @property {string} title 片名
 * @property {number} year 上映年份
 * @property {string[]} genres 题材标签
 */

/** @type {ReadonlyArray<Movie>} */
export const MOVIES = Object.freeze([
  { id: 'spirited-away-2001', title: '千与千寻', year: 2001, genres: ['动画', '奇幻'] },
  { id: 'mad-max-fury-road-2015', title: '疯狂的麦克斯4：狂暴之路', year: 2015, genres: ['动作', '科幻'] },
  { id: 'interstellar-2014', title: '星际穿越', year: 2014, genres: ['科幻', '冒险'] },
  { id: 'the-godfather-1972', title: '教父', year: 1972, genres: ['犯罪', '剧情'] },
  { id: 'shawshank-1994', title: '肖申克的救赎', year: 1994, genres: ['剧情', '犯罪'] },
  { id: 'grand-budapest-2014', title: '布达佩斯大饭店', year: 2014, genres: ['喜剧', '剧情'] },
  { id: 'your-name-2016', title: '你的名字。', year: 2016, genres: ['动画', '爱情'] },
  { id: 'inception-2010', title: '盗梦空间', year: 2010, genres: ['科幻', '悬疑'] },
  { id: 'let-the-bullets-fly-2010', title: '让子弹飞', year: 2010, genres: ['喜剧', '动作'] },
  { id: 'dune-2021', title: '沙丘', year: 2021, genres: ['科幻', '冒险'] },
  { id: 'eeaao-2022', title: '瞬息全宇宙', year: 2022, genres: ['奇幻', '喜剧'] },
  { id: 'farewell-my-concubine-1993', title: '霸王别姬', year: 1993, genres: ['剧情', '爱情'] },
]);

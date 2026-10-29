import type { Movie } from '../game/types';
import { createMovieSource } from './source';

/**
 * 数据性质标识。
 *
 * 当前库内全部为**合成的测试数据**，不是豆瓣、猫眼或任何真实平台的评分。
 * 在任何 UI、文档、截图里都不得把它描述成真实评分。
 */
export const SYNTHETIC_DATA_SOURCE = '合成测试数据（非真实评分）';

export const SYNTHETIC_DATA_DISCLAIMER =
  '本页所有片名、年份与评分均为演示用的合成数据，与豆瓣等真实平台的评分无关。';

interface SeedRow {
  readonly id: string;
  readonly title: string;
  readonly year: number;
  readonly rating: number;
}

/**
 * 60 条合成种子数据。
 *
 * 刻意覆盖三个难度区间：既有明显的 1 分以上差距，也有 0.1–0.2 的微小差距，
 * 以便专家难度也能抽出题目。片库扩容由后续任务处理（见 docs/TASKS.md）。
 */
const SEED: readonly SeedRow[] = [
  { id: 'm001', title: '雾港迷踪', year: 2019, rating: 8.6 },
  { id: 'm002', title: '第七个夏天', year: 2016, rating: 8.1 },
  { id: 'm003', title: '铁皮月亮', year: 2021, rating: 7.4 },
  { id: 'm004', title: '长夜将尽', year: 2013, rating: 8.9 },
  { id: 'm005', title: '白鹿车站', year: 2018, rating: 7.2 },
  { id: 'm006', title: '逆流之岸', year: 2022, rating: 6.8 },
  { id: 'm007', title: '两只乌鸦', year: 2011, rating: 9.1 },
  { id: 'm008', title: '无声电报', year: 2020, rating: 7.9 },
  { id: 'm009', title: '玻璃温室', year: 2015, rating: 6.4 },
  { id: 'm010', title: '海平面之下', year: 2017, rating: 8.3 },
  { id: 'm011', title: '铃铛与雪', year: 2012, rating: 7.7 },
  { id: 'm012', title: '最后的放映员', year: 2014, rating: 9.3 },
  { id: 'm013', title: '沙丘来信', year: 2023, rating: 6.2 },
  { id: 'm014', title: '南方慢车', year: 2010, rating: 8.4 },
  { id: 'm015', title: '蓝色证词', year: 2019, rating: 7.6 },
  { id: 'm016', title: '十日雨', year: 2008, rating: 8.8 },
  { id: 'm017', title: '空房间的访客', year: 2021, rating: 5.9 },
  { id: 'm018', title: '纸飞机航线', year: 2016, rating: 7.1 },
  { id: 'm019', title: '午夜缝纫机', year: 2013, rating: 8.7 },
  { id: 'm020', title: '会说话的灯塔', year: 2024, rating: 6.5 },
  { id: 'm021', title: '荒原旅店', year: 2009, rating: 8.0 },
  { id: 'm022', title: '两个冬天', year: 2018, rating: 7.3 },
  { id: 'm023', title: '深红色信号', year: 2015, rating: 9.0 },
  { id: 'm024', title: '第五封信', year: 2020, rating: 6.9 },
  { id: 'm025', title: '镜中火车', year: 2011, rating: 8.2 },
  { id: 'm026', title: '半座城市', year: 2025, rating: 5.4 },
  { id: 'm027', title: '大河无声', year: 2007, rating: 9.2 },
  { id: 'm028', title: '灯笼与枪', year: 2019, rating: 7.0 },
  { id: 'm029', title: '遥远的雨声', year: 2012, rating: 8.5 },
  { id: 'm030', title: '灰色的星期三', year: 2017, rating: 6.1 },
  { id: 'm031', title: '旧唱片店', year: 2014, rating: 7.8 },
  { id: 'm032', title: '群山之间', year: 2022, rating: 9.4 },
  { id: 'm033', title: '夜班护士', year: 2016, rating: 6.6 },
  { id: 'm034', title: '赤脚过冬', year: 2006, rating: 7.5 },
  { id: 'm035', title: '樟树下', year: 2010, rating: 6.3 },
  { id: 'm036', title: '消失的胶片', year: 2023, rating: 5.2 },
  { id: 'm037', title: '十二盏路灯', year: 2005, rating: 9.5 },
  { id: 'm038', title: '潮汐旅馆', year: 2021, rating: 5.7 },
  { id: 'm039', title: '冬泳者', year: 2018, rating: 9.6 },
  { id: 'm040', title: '面包与盐', year: 2013, rating: 6.7 },
  { id: 'm041', title: '无声的鼓', year: 2009, rating: 9.8 },
  { id: 'm042', title: '候鸟时刻', year: 2020, rating: 6.0 },
  { id: 'm043', title: '屋顶上的海', year: 2016, rating: 4.6 },
  { id: 'm044', title: '最后一班渡轮', year: 2012, rating: 4.2 },
  { id: 'm045', title: '铁锈与花', year: 2024, rating: 5.5 },
  { id: 'm046', title: '无声暴雨', year: 2010, rating: 3.9 },
  { id: 'm047', title: '玻璃城', year: 2019, rating: 4.9 },
  { id: 'm048', title: '三个人的晚餐', year: 2015, rating: 3.6 },
  { id: 'm049', title: '银河摆渡人', year: 2023, rating: 9.9 },
  { id: 'm050', title: '谁在敲门', year: 2008, rating: 5.1 },
  { id: 'm051', title: '旧时钟声', year: 2017, rating: 9.7 },
  { id: 'm052', title: '麦田之北', year: 2011, rating: 3.3 },
  { id: 'm053', title: '雨季清单', year: 2022, rating: 5.8 },
  { id: 'm054', title: '双城记事', year: 2014, rating: 4.4 },
  { id: 'm055', title: '夜行者', year: 2009, rating: 5.3 },
  { id: 'm056', title: '旧日回响', year: 2025, rating: 3.1 },
  { id: 'm057', title: '海边电影院', year: 2013, rating: 5.0 },
  { id: 'm058', title: '十字路口', year: 2018, rating: 4.0 },
  { id: 'm059', title: '薄雾之城', year: 2020, rating: 4.7 },
  { id: 'm060', title: '冬天的信', year: 2016, rating: 5.6 },
];

const RAW_MOVIES: readonly Movie[] = SEED.map((row) => ({
  id: row.id,
  title: row.title,
  year: row.year,
  rating: row.rating,
  ratingSource: SYNTHETIC_DATA_SOURCE,
}));

/** 默认电影数据源。UI 通过它取数据，未来换数据源只需替换这一层。 */
export const SYNTHETIC_MOVIE_SOURCE = createMovieSource({
  name: 'synthetic-demo',
  disclaimer: SYNTHETIC_DATA_DISCLAIMER,
  movies: RAW_MOVIES,
});

/** 便捷导出：默认片库。 */
export const MOVIES: readonly Movie[] = SYNTHETIC_MOVIE_SOURCE.movies;

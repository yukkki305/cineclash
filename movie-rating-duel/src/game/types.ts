/**
 * 领域模型与游戏状态类型。
 *
 * 这里只放类型与常量，不放业务逻辑，方便被引擎、数据层和 UI 共同引用。
 */

/** 一条电影记录。评分与评分来源是必填项：没有来源的评分不允许进入游戏。 */
export interface Movie {
  /** 稳定 ID，用于去重与配对键。 */
  readonly id: string;
  readonly title: string;
  /** 上映年份。 */
  readonly year: number;
  /** 评分，按数值比较，不做字符串比较。 */
  readonly rating: number;
  /** 评分来源说明，必须能让玩家判断数据性质（例如合成测试数据）。 */
  readonly ratingSource: string;
  /** 海报地址，缺失时 UI 需要优雅降级。 */
  readonly posterUrl?: string;
}

/** 难度标识。 */
export type DifficultyId = 'normal' | 'advanced' | 'expert';

/** 难度配置：评分差区间为闭区间，按绝对值判断。 */
export interface DifficultyConfig {
  readonly id: DifficultyId;
  readonly label: string;
  readonly labelZh: string;
  readonly minGap: number;
  readonly maxGap: number;
  readonly hint: string;
}

/** 年份筛选范围，闭区间。 */
export interface YearRange {
  readonly from: number;
  readonly to: number;
}

/** 一局的配置。 */
export interface GameConfig {
  readonly difficulty: DifficultyId;
  readonly yearRange: YearRange;
}

/** 一道题：两部不同的电影，以及评分更高的那一部的 ID。 */
export interface Question {
  readonly a: Movie;
  readonly b: Movie;
  readonly correctId: string;
  /** 无序配对键，用于本局内去重。 */
  readonly pairKey: string;
}

export type GamePhase = 'idle' | 'playing' | 'finished';

/** 最近一次作答的反馈。非 null 表示当前题目已被消费，等待进入下一题。 */
export interface AnswerFeedback {
  readonly chosenId: string;
  readonly outcome: 'correct' | 'wrong';
}

export interface GameState {
  readonly phase: GamePhase;
  readonly config: GameConfig | null;
  /** 剩余生命，永不为负。 */
  readonly lives: number;
  readonly score: number;
  /** 已作答题数，用于正确率分母。 */
  readonly answered: number;
  /** 答对题数，用于正确率分子。 */
  readonly correct: number;
  readonly question: Question | null;
  /** 本局已使用过的无序配对键。 */
  readonly usedPairs: readonly string[];
  readonly feedback: AnswerFeedback | null;
  /** 题目池耗尽而结束时为 true，用于和「生命耗尽」区分。 */
  readonly exhausted: boolean;
}

/** 可注入的随机源，返回 [0, 1) 之间的数。 */
export type Rng = () => number;

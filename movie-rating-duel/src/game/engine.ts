import { getDifficulty } from './difficulty';
import { selectQuestion } from './question';
import type { GameConfig, GameState, Movie, Rng } from './types';

/** 每局固定 5 条命（规则 1）。 */
export const LIVES_PER_GAME = 5;

/** 尚未开始的空闲状态。 */
export function createIdleState(): GameState {
  return {
    phase: 'idle',
    config: null,
    lives: LIVES_PER_GAME,
    score: 0,
    answered: 0,
    correct: 0,
    question: null,
    usedPairs: [],
    feedback: null,
    exhausted: false,
  };
}

/** 校验一局的配置，非法输入直接抛错而不是静默修正。 */
export function assertValidConfig(config: GameConfig): void {
  const { from, to } = config.yearRange;
  if (!Number.isInteger(from) || !Number.isInteger(to)) {
    throw new RangeError('年份筛选必须是整数');
  }
  if (from > to) {
    throw new RangeError(`起始年份不能大于结束年份：${from} > ${to}`);
  }
}

/**
 * 开始新的一局。
 *
 * 规则 1/8：生命重置为 5，得分、答题计数、配对历史全部清零。
 * 规则 13：抽不到题时安全结束，并标记 exhausted，交给 UI 提示「题目不足」。
 */
export function startGame(
  _state: GameState,
  config: GameConfig,
  movies: readonly Movie[],
  rng: Rng,
): GameState {
  assertValidConfig(config);
  const base: GameState = {
    ...createIdleState(),
    phase: 'playing',
    config,
  };
  const question = drawQuestion(base, movies, rng);
  if (!question) {
    return { ...base, phase: 'finished', exhausted: true };
  }
  return { ...base, question, usedPairs: [question.pairKey] };
}

/**
 * 提交当前题目的答案。
 *
 * 规则 3：答错恰好扣一条生命；规则 4：生命不为负；规则 5/6：
 * 同一题只接受一次作答，结束或已作答后忽略新的提交。
 * 规则 2：答对 +1 分。生命归零立即结束（规则 7）。
 */
export function answerQuestion(state: GameState, movieId: string): GameState {
  if (state.phase !== 'playing') return state;
  if (!state.question) return state;
  if (state.feedback) return state;

  const { question } = state;
  if (movieId !== question.a.id && movieId !== question.b.id) return state;

  const outcome = movieId === question.correctId ? 'correct' : 'wrong';
  const isCorrect = outcome === 'correct';
  const lives = isCorrect ? state.lives : Math.max(0, state.lives - 1);

  return {
    ...state,
    lives,
    score: state.score + (isCorrect ? 1 : 0),
    answered: state.answered + 1,
    correct: state.correct + (isCorrect ? 1 : 0),
    feedback: { chosenId: movieId, outcome },
    phase: lives === 0 ? 'finished' : 'playing',
  };
}

/**
 * 进入下一题。
 *
 * 只有当前题目已经作答（feedback 非空）时才推进，否则保持原状。
 * 抽不到题时安全结束并标记 exhausted（规则 13）。
 */
export function advanceQuestion(
  state: GameState,
  movies: readonly Movie[],
  rng: Rng,
): GameState {
  if (state.phase !== 'playing') return state;
  if (!state.question || !state.feedback) return state;

  const question = drawQuestion(state, movies, rng);
  if (!question) {
    return { ...state, phase: 'finished', exhausted: true, question: null, feedback: null };
  }
  return {
    ...state,
    question,
    usedPairs: state.usedPairs.includes(question.pairKey)
      ? state.usedPairs
      : [...state.usedPairs, question.pairKey],
    feedback: null,
  };
}

/**
 * 重开一局。
 *
 * 规则 8：得分、生命、答题计数、配对历史全部重置。
 * 沿用上一局的配置；没有配置时回到首页。
 */
export function restartGame(
  state: GameState,
  movies: readonly Movie[],
  rng: Rng,
): GameState {
  if (!state.config) return createIdleState();
  return startGame(state, state.config, movies, rng);
}

/** 正确率：答对 / 已作答；未作答返回 null，由 UI 显示「暂不可用」（绝不除零）。 */
export function accuracyOf(state: GameState): number | null {
  if (state.answered === 0) return null;
  return state.correct / state.answered;
}

/** 是否已经打完（生命耗尽或题目池耗尽）。 */
export function isFinished(state: GameState): boolean {
  return state.phase === 'finished';
}

function drawQuestion(state: GameState, movies: readonly Movie[], rng: Rng) {
  if (!state.config) return null;
  return selectQuestion(
    movies,
    {
      difficulty: getDifficulty(state.config.difficulty),
      yearRange: state.config.yearRange,
      usedPairs: state.usedPairs,
    },
    rng,
  );
}

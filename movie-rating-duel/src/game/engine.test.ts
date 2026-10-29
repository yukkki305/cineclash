import { describe, expect, it } from 'vitest';
import {
  LIVES_PER_GAME,
  accuracyOf,
  advanceQuestion,
  answerQuestion,
  createIdleState,
  restartGame,
  startGame,
} from './engine';
import type { GameConfig, GameState, Question } from './types';
import { MOVIE_HIGH, MOVIE_LOW, TWO_MOVIES, constantRng } from '../test/fixtures';

const CONFIG: GameConfig = { difficulty: 'normal', yearRange: { from: 2000, to: 2030 } };
const RNG = constantRng(0);

function requireQuestion(state: GameState): Question {
  if (!state.question) throw new Error('预期当前题目存在，但为 null');
  return state.question;
}

function startTestGame(): GameState {
  return startGame(createIdleState(), CONFIG, TWO_MOVIES, RNG);
}

describe('createIdleState', () => {
  it('空闲状态拥有完整生命且数据清零', () => {
    const state = createIdleState();
    expect(state.phase).toBe('idle');
    expect(state.lives).toBe(LIVES_PER_GAME);
    expect(state.score).toBe(0);
    expect(state.answered).toBe(0);
    expect(state.correct).toBe(0);
    expect(state.question).toBeNull();
    expect(state.usedPairs).toEqual([]);
    expect(state.feedback).toBeNull();
    expect(state.exhausted).toBe(false);
  });
});

describe('startGame', () => {
  it('开局恰好 5 条命并给出第一道题（规则 1）', () => {
    const state = startTestGame();
    expect(state.phase).toBe('playing');
    expect(state.lives).toBe(5);
    expect(state.score).toBe(0);
    expect(requireQuestion(state).pairKey).toBe('a|b');
    expect(state.usedPairs).toEqual(['a|b']);
  });

  it('起始年份大于结束年份时抛错', () => {
    expect(() =>
      startGame(
        createIdleState(),
        { difficulty: 'normal', yearRange: { from: 2020, to: 2010 } },
        TWO_MOVIES,
        RNG,
      ),
    ).toThrow(RangeError);
  });

  it('年份不是整数时抛错', () => {
    expect(() =>
      startGame(
        createIdleState(),
        { difficulty: 'normal', yearRange: { from: 2000.5, to: 2030 } },
        TWO_MOVIES,
        RNG,
      ),
    ).toThrow(RangeError);
  });

  it('没有合法题目时安全结束而不是死循环（规则 13）', () => {
    const state = startGame(createIdleState(), CONFIG, [MOVIE_HIGH], RNG);
    expect(state.phase).toBe('finished');
    expect(state.exhausted).toBe(true);
    expect(state.question).toBeNull();
  });
});

describe('answerQuestion', () => {
  it('答对加一分且生命不变（规则 2）', () => {
    const state = startTestGame();
    const next = answerQuestion(state, MOVIE_HIGH.id);
    expect(next.score).toBe(1);
    expect(next.lives).toBe(5);
    expect(next.answered).toBe(1);
    expect(next.correct).toBe(1);
    expect(next.feedback).toEqual({ chosenId: MOVIE_HIGH.id, outcome: 'correct' });
    expect(next.phase).toBe('playing');
  });

  it('答错恰好扣一条命（规则 3）', () => {
    const state = startTestGame();
    const next = answerQuestion(state, MOVIE_LOW.id);
    expect(next.lives).toBe(4);
    expect(next.score).toBe(0);
    expect(next.answered).toBe(1);
    expect(next.correct).toBe(0);
    expect(next.feedback).toEqual({ chosenId: MOVIE_LOW.id, outcome: 'wrong' });
  });

  it('同一题重复提交被忽略（规则 5）', () => {
    const state = answerQuestion(startTestGame(), MOVIE_LOW.id);
    const again = answerQuestion(state, MOVIE_HIGH.id);
    expect(again).toBe(state);
    expect(again.lives).toBe(4);
    expect(again.score).toBe(0);
  });

  it('不存在的电影 ID 被忽略', () => {
    const state = startTestGame();
    expect(answerQuestion(state, 'not-a-movie')).toBe(state);
  });

  it('生命不会低于 0，且五次答错后结束（规则 4/7）', () => {
    let state = startTestGame();
    for (let round = 0; round < LIVES_PER_GAME; round += 1) {
      const question = requireQuestion(state);
      const wrongId = question.a.id === question.correctId ? question.b.id : question.a.id;
      state = answerQuestion(state, wrongId);
      if (round < LIVES_PER_GAME - 1) {
        state = advanceQuestion(state, TWO_MOVIES, RNG);
      }
    }
    expect(state.lives).toBe(0);
    expect(state.phase).toBe('finished');
    expect(state.answered).toBe(5);
    expect(state.correct).toBe(0);
  });

  it('结束之后不再接受答案（规则 6）', () => {
    const finished: GameState = { ...startTestGame(), phase: 'finished', lives: 0 };
    expect(answerQuestion(finished, MOVIE_HIGH.id)).toBe(finished);
  });
});

describe('advanceQuestion', () => {
  it('未作答时不能进入下一题', () => {
    const state = startTestGame();
    expect(advanceQuestion(state, TWO_MOVIES, RNG)).toBe(state);
  });

  it('作答后清空反馈并记录新配对（规则 15）', () => {
    const answered = answerQuestion(startTestGame(), MOVIE_HIGH.id);
    const next = advanceQuestion(answered, TWO_MOVIES, RNG);
    expect(next.feedback).toBeNull();
    expect(next.question).not.toBeNull();
    expect(next.usedPairs).toEqual(['a|b']);
  });

  it('题目耗尽时安全结束', () => {
    const answered = answerQuestion(startTestGame(), MOVIE_HIGH.id);
    const next = advanceQuestion(answered, [MOVIE_HIGH], RNG);
    expect(next.phase).toBe('finished');
    expect(next.exhausted).toBe(true);
    expect(next.feedback).toBeNull();
  });
});

describe('restartGame', () => {
  it('重开重置得分、生命、计数与配对历史（规则 8）', () => {
    let state = startTestGame();
    state = answerQuestion(state, MOVIE_HIGH.id);
    state = advanceQuestion(state, TWO_MOVIES, RNG);
    state = answerQuestion(state, MOVIE_HIGH.id);

    const restarted = restartGame(state, TWO_MOVIES, RNG);
    expect(restarted.score).toBe(0);
    expect(restarted.lives).toBe(LIVES_PER_GAME);
    expect(restarted.answered).toBe(0);
    expect(restarted.correct).toBe(0);
    expect(restarted.usedPairs).toHaveLength(1);
    expect(restarted.phase).toBe('playing');
    expect(restarted.config).toEqual(CONFIG);
  });

  it('没有配置时回到首页', () => {
    expect(restartGame(createIdleState(), TWO_MOVIES, RNG).phase).toBe('idle');
  });
});

describe('accuracyOf', () => {
  it('未作答时返回 null，绝不除零', () => {
    expect(accuracyOf(createIdleState())).toBeNull();
  });

  it('按答对 / 已作答计算', () => {
    let state = startTestGame();
    state = answerQuestion(state, MOVIE_HIGH.id);
    expect(accuracyOf(state)).toBe(1);
    state = advanceQuestion(state, TWO_MOVIES, RNG);
    state = answerQuestion(state, MOVIE_LOW.id);
    expect(accuracyOf(state)).toBe(0.5);
  });
});

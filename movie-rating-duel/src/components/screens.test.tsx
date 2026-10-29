import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameScreen } from './GameScreen';
import { HomeScreen } from './HomeScreen';
import { ResultScreen } from './ResultScreen';
import type { GameConfig, GameState, Question } from '../game/types';
import { MOVIE_HIGH, MOVIE_LOW } from '../test/fixtures';

const QUESTION: Question = {
  a: MOVIE_HIGH,
  b: MOVIE_LOW,
  correctId: MOVIE_HIGH.id,
  pairKey: 'a|b',
};

function playingState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'playing',
    config: { difficulty: 'normal', yearRange: { from: 2000, to: 2030 } },
    lives: 5,
    score: 0,
    answered: 0,
    correct: 0,
    question: QUESTION,
    usedPairs: ['a|b'],
    feedback: null,
    exhausted: false,
    ...overrides,
  };
}

describe('GameScreen', () => {
  it('作答前隐藏评分，避免直接看答案', () => {
    render(
      <GameScreen state={playingState()} onAnswer={vi.fn()} onNext={vi.fn()} onQuit={vi.fn()} />,
    );
    expect(screen.getAllByText('评分已隐藏')).toHaveLength(2);
    expect(screen.queryByText('8.0')).not.toBeInTheDocument();
  });

  it('显示片名、年份与生命值', () => {
    render(
      <GameScreen state={playingState()} onAnswer={vi.fn()} onNext={vi.fn()} onQuit={vi.fn()} />,
    );
    expect(screen.getByText('《高分片》')).toBeInTheDocument();
    expect(screen.getByText('《低分片》')).toBeInTheDocument();
    expect(screen.getByLabelText('剩余生命 5 / 5')).toBeInTheDocument();
  });

  it('点击卡片回调对应电影的 ID', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(
      <GameScreen state={playingState()} onAnswer={onAnswer} onNext={vi.fn()} onQuit={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: '选择《高分片》' }));
    expect(onAnswer).toHaveBeenCalledWith(MOVIE_HIGH.id);
  });

  it('答对后揭示评分并给出正确反馈', () => {
    render(
      <GameScreen
        state={playingState({
          score: 1,
          answered: 1,
          correct: 1,
          feedback: { chosenId: MOVIE_HIGH.id, outcome: 'correct' },
        })}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onQuit={vi.fn()}
      />,
    );
    expect(screen.getByText(/答对了/)).toBeInTheDocument();
    expect(screen.getByText('8.0')).toBeInTheDocument();
    expect(screen.getByText('7.0')).toBeInTheDocument();
    expect(screen.getByText('正确答案')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一题' })).toBeEnabled();
  });

  it('答错后给出正确答案与剩余生命', () => {
    render(
      <GameScreen
        state={playingState({
          lives: 4,
          answered: 1,
          feedback: { chosenId: MOVIE_LOW.id, outcome: 'wrong' },
        })}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onQuit={vi.fn()}
      />,
    );
    expect(screen.getByText(/答错了/)).toBeInTheDocument();
    expect(screen.getByLabelText('剩余生命 4 / 5')).toBeInTheDocument();
    expect(screen.getByText(/剩余生命\s*4/)).toBeInTheDocument();
  });

  it('未作答时「下一题」不可用', () => {
    render(
      <GameScreen state={playingState()} onAnswer={vi.fn()} onNext={vi.fn()} onQuit={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: '下一题' })).toBeDisabled();
  });

  it('正确率在未作答时显示「暂不可用」', () => {
    render(
      <GameScreen state={playingState()} onAnswer={vi.fn()} onNext={vi.fn()} onQuit={vi.fn()} />,
    );
    expect(screen.getByText('暂不可用')).toBeInTheDocument();
  });
});

describe('ResultScreen', () => {
  it('展示得分与正确率', () => {
    render(
      <ResultScreen
        state={playingState({ phase: 'finished', lives: 0, score: 3, answered: 4, correct: 3 })}
        disclaimer="免责声明"
        onRestart={vi.fn()}
        onHome={vi.fn()}
      />,
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('得分').parentElement).toHaveTextContent('得分3');
    expect(screen.getByText('生命耗尽，本局结束。')).toBeInTheDocument();
  });

  it('未作答时正确率显示「暂不可用」且不除零', () => {
    render(
      <ResultScreen
        state={playingState({ phase: 'finished', lives: 0, answered: 0, correct: 0 })}
        disclaimer="免责声明"
        onRestart={vi.fn()}
        onHome={vi.fn()}
      />,
    );
    expect(screen.getByText('暂不可用')).toBeInTheDocument();
    expect(screen.getByText('本局没有作答记录，正确率暂不可用。')).toBeInTheDocument();
  });

  it('题目耗尽时提示提前结束', () => {
    render(
      <ResultScreen
        state={playingState({ phase: 'finished', exhausted: true })}
        disclaimer="免责声明"
        onRestart={vi.fn()}
        onHome={vi.fn()}
      />,
    );
    expect(screen.getByText('当前筛选下的题目已用尽，本局提前结束。')).toBeInTheDocument();
  });
});

describe('HomeScreen', () => {
  const CONFIG: GameConfig = { difficulty: 'normal', yearRange: { from: 2018, to: 2020 } };
  const MOVIES = [MOVIE_HIGH, MOVIE_LOW];

  it('默认配置下可以开始', () => {
    render(
      <HomeScreen movies={MOVIES} disclaimer="免责声明" initialConfig={CONFIG} onStart={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: '开始游戏' })).toBeEnabled();
  });

  it('起始年份晚于结束年份时报错并禁用开始', async () => {
    const user = userEvent.setup();
    render(
      <HomeScreen movies={MOVIES} disclaimer="免责声明" initialConfig={CONFIG} onStart={vi.fn()} />,
    );
    const from = screen.getByLabelText('起始年份');
    await user.clear(from);
    await user.type(from, '2020');
    const to = screen.getByLabelText('结束年份');
    await user.clear(to);
    await user.type(to, '2018');

    expect(screen.getByRole('alert')).toHaveTextContent('起始年份不能晚于结束年份');
    expect(screen.getByRole('button', { name: '开始游戏' })).toBeDisabled();
  });

  it('年份超出片库范围时报错', async () => {
    const user = userEvent.setup();
    render(
      <HomeScreen movies={MOVIES} disclaimer="免责声明" initialConfig={CONFIG} onStart={vi.fn()} />,
    );
    const from = screen.getByLabelText('起始年份');
    await user.clear(from);
    await user.type(from, '1800');

    expect(screen.getByRole('alert')).toHaveTextContent('年份需在 2018–2020 之间');
  });

  it('没有合法题目时报错并禁用开始', async () => {
    const user = userEvent.setup();
    render(
      <HomeScreen movies={MOVIES} disclaimer="免责声明" initialConfig={CONFIG} onStart={vi.fn()} />,
    );
    // 两部片评分差 1.0，专家难度区间是 0.1–0.2，必然抽不出题。
    await user.click(screen.getByRole('radio', { name: /专家/ }));

    expect(screen.getByRole('alert')).toHaveTextContent('没有合法题目');
    expect(screen.getByRole('button', { name: '开始游戏' })).toBeDisabled();
  });

  it('点击开始把当前配置传出去', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(
      <HomeScreen movies={MOVIES} disclaimer="免责声明" initialConfig={CONFIG} onStart={onStart} />,
    );
    await user.click(screen.getByRole('button', { name: '开始游戏' }));
    expect(onStart).toHaveBeenCalledWith({ difficulty: 'normal', yearRange: { from: 2018, to: 2020 } });
  });
});

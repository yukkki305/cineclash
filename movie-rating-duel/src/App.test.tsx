import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import type { Movie } from './game/types';
import { MOVIE_HIGH, MOVIE_LOW, TWO_MOVIES, constantRng } from './test/fixtures';

describe('App', () => {
  it('首页显示规则说明、难度与开始按钮', () => {
    render(<App movies={TWO_MOVIES} disclaimer="合成数据" rng={constantRng(0)} />);
    expect(screen.getByRole('heading', { name: '谁的评分更高？' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /普通/ })).toBeChecked();
    expect(screen.getByRole('button', { name: '开始游戏' })).toBeEnabled();
    expect(screen.getByText('合成数据')).toBeInTheDocument();
  });

  it('开始游戏后进入答题界面', async () => {
    const user = userEvent.setup();
    render(<App movies={TWO_MOVIES} disclaimer="合成数据" rng={constantRng(0)} />);
    await user.click(screen.getByRole('button', { name: '开始游戏' }));

    expect(screen.getByRole('heading', { name: '哪一部的评分更高？' })).toBeInTheDocument();
    expect(screen.getByText('《高分片》')).toBeInTheDocument();
    expect(screen.getByText('《低分片》')).toBeInTheDocument();
    expect(screen.getByLabelText('剩余生命 5 / 5')).toBeInTheDocument();
  });

  it('完整走一轮：答对加一分、进入下一题', async () => {
    const user = userEvent.setup();
    render(<App movies={TWO_MOVIES} disclaimer="合成数据" rng={constantRng(0)} />);
    await user.click(screen.getByRole('button', { name: '开始游戏' }));

    await user.click(screen.getByRole('button', { name: '选择《高分片》' }));
    expect(screen.getByText(/答对了/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '下一题' }));
    expect(screen.getByText('第')).toBeInTheDocument();
    expect(screen.queryByText(/答对了/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('剩余生命 5 / 5')).toBeInTheDocument();
  });

  it('答错扣命，五次答错后进入结束页', async () => {
    const user = userEvent.setup();
    render(<App movies={TWO_MOVIES} disclaimer="合成数据" rng={constantRng(0)} />);
    await user.click(screen.getByRole('button', { name: '开始游戏' }));

    for (let round = 0; round < 5; round += 1) {
      // 低分片永远不是正确答案，点它必定答错。
      await user.click(screen.getByRole('button', { name: '选择《低分片》' }));
      if (round < 4) {
        await user.click(screen.getByRole('button', { name: '下一题' }));
      }
    }

    expect(screen.getByRole('heading', { name: '本局结束' })).toBeInTheDocument();
    expect(screen.getByText('生命耗尽，本局结束。')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('结束页可以再来一局并重置成绩', async () => {
    const user = userEvent.setup();
    render(<App movies={TWO_MOVIES} disclaimer="合成数据" rng={constantRng(0)} />);
    await user.click(screen.getByRole('button', { name: '开始游戏' }));
    for (let round = 0; round < 5; round += 1) {
      await user.click(screen.getByRole('button', { name: '选择《低分片》' }));
      if (round < 4) {
        await user.click(screen.getByRole('button', { name: '下一题' }));
      }
    }

    await user.click(screen.getByRole('button', { name: '再来一局' }));
    expect(screen.getByLabelText('剩余生命 5 / 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '哪一部的评分更高？' })).toBeInTheDocument();
  });

  it('片库不足以出题时禁用开始', () => {
    const single: readonly Movie[] = [MOVIE_HIGH, MOVIE_LOW].slice(0, 1);
    render(<App movies={single} disclaimer="合成数据" rng={constantRng(0)} />);
    expect(screen.getByRole('alert')).toHaveTextContent('没有合法题目');
    expect(screen.getByRole('button', { name: '开始游戏' })).toBeDisabled();
  });
});

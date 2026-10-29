import { LIVES_PER_GAME, accuracyOf } from '../game/engine';
import type { GameState } from '../game/types';
import { formatAccuracy } from './GameScreen';

export interface ResultScreenProps {
  readonly state: GameState;
  readonly disclaimer: string;
  readonly onRestart: () => void;
  readonly onHome: () => void;
}

export function ResultScreen({ state, disclaimer, onRestart, onHome }: ResultScreenProps) {
  const accuracy = accuracyOf(state);
  const reason = state.exhausted
    ? '当前筛选下的题目已用尽，本局提前结束。'
    : '生命耗尽，本局结束。';

  return (
    <section className="screen">
      <header className="hero">
        <h1 className="hero__title">本局结束</h1>
        <p className="hero__subtitle">{reason}</p>
      </header>

      <dl className="result-grid">
        <div className="result-item">
          <dt>得分</dt>
          <dd>{state.score}</dd>
        </div>
        <div className="result-item">
          <dt>已作答</dt>
          <dd>{state.answered}</dd>
        </div>
        <div className="result-item">
          <dt>答对</dt>
          <dd>{state.correct}</dd>
        </div>
        <div className="result-item">
          <dt>正确率</dt>
          <dd>{formatAccuracy(state)}</dd>
        </div>
        <div className="result-item">
          <dt>剩余生命</dt>
          <dd>
            {state.lives} / {LIVES_PER_GAME}
          </dd>
        </div>
      </dl>

      <p className="result-note">
        {accuracy === null
          ? '本局没有作答记录，正确率暂不可用。'
          : `共答 ${state.answered} 题，答对 ${state.correct} 题。`}
      </p>

      <div className="actions">
        <button type="button" className="btn btn--primary" onClick={onRestart}>
          再来一局
        </button>
        <button type="button" className="btn btn--ghost" onClick={onHome}>
          返回首页
        </button>
      </div>

      <p className="disclaimer">{disclaimer}</p>
    </section>
  );
}

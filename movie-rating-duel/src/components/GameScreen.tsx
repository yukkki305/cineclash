import { LIVES_PER_GAME, accuracyOf } from '../game/engine';
import type { GameState } from '../game/types';
import { MovieCard, type CardStatus } from './MovieCard';

export interface GameScreenProps {
  readonly state: GameState;
  readonly onAnswer: (movieId: string) => void;
  readonly onNext: () => void;
  readonly onQuit: () => void;
}

/** 正确率格式化：未作答时显示「暂不可用」，绝不除零。 */
export function formatAccuracy(state: GameState): string {
  const value = accuracyOf(state);
  if (value === null) return '暂不可用';
  return `${Math.round(value * 100)}%`;
}

function statusFor(
  movieId: string,
  correctId: string,
  chosenId: string | undefined,
  revealed: boolean,
): CardStatus {
  if (!revealed) return 'idle';
  if (movieId === correctId) return 'correct';
  if (movieId === chosenId) return 'wrong';
  return 'dim';
}

export function GameScreen({ state, onAnswer, onNext, onQuit }: GameScreenProps) {
  const { question, feedback } = state;
  if (!question) {
    return (
      <section className="screen">
        <p className="notice">当前条件下抽不出题目。</p>
        <button type="button" className="btn" onClick={onQuit}>
          返回首页
        </button>
      </section>
    );
  }

  const revealed = feedback !== null;
  const answeredId = feedback?.chosenId;
  const correctMovie =
    question.a.id === question.correctId ? question.a : question.b;
  const questionNumber = state.answered + (revealed ? 0 : 1);

  return (
    <section className="screen">
      <header className="hud">
        <div className="hud__item">
          <span className="hud__label">第</span>
          <span className="hud__value">{questionNumber}</span>
          <span className="hud__label">题</span>
        </div>
        <div className="hud__item" aria-label={`剩余生命 ${state.lives} / ${LIVES_PER_GAME}`}>
          <span className="hud__label">生命</span>
          <span className="hud__hearts" aria-hidden="true">
            {'♥'.repeat(state.lives)}
            {'♡'.repeat(Math.max(0, LIVES_PER_GAME - state.lives))}
          </span>
        </div>
        <div className="hud__item">
          <span className="hud__label">得分</span>
          <span className="hud__value">{state.score}</span>
        </div>
        <div className="hud__item">
          <span className="hud__label">正确率</span>
          <span className="hud__value">{formatAccuracy(state)}</span>
        </div>
      </header>

      <h2 className="prompt">哪一部的评分更高？</h2>

      <div className="duel">
        <MovieCard
          movie={question.a}
          position="left"
          reveal={revealed}
          disabled={revealed}
          status={statusFor(question.a.id, question.correctId, answeredId, revealed)}
          onSelect={() => onAnswer(question.a.id)}
        />
        <span className="duel__vs" aria-hidden="true">
          VS
        </span>
        <MovieCard
          movie={question.b}
          position="right"
          reveal={revealed}
          disabled={revealed}
          status={statusFor(question.b.id, question.correctId, answeredId, revealed)}
          onSelect={() => onAnswer(question.b.id)}
        />
      </div>

      <div className="feedback" role="status" aria-live="polite">
        {feedback === null ? (
          <span className="feedback__hint">点击你认为评分更高的那一部。</span>
        ) : feedback.outcome === 'correct' ? (
          <span className="feedback__correct">
            答对了！《{correctMovie.title}》的评分更高（{correctMovie.rating.toFixed(1)} 分）。
          </span>
        ) : (
          <span className="feedback__wrong">
            答错了。正确答案是《{correctMovie.title}》（{correctMovie.rating.toFixed(1)} 分），剩余生命{' '}
            {state.lives}。
          </span>
        )}
      </div>

      <div className="actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onNext}
          disabled={!revealed || state.phase !== 'playing'}
        >
          下一题
        </button>
        <button type="button" className="btn btn--ghost" onClick={onQuit}>
          返回首页
        </button>
      </div>
    </section>
  );
}

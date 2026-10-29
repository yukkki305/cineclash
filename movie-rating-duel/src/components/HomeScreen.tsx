import { useMemo, useState } from 'react';
import { DEFAULT_DIFFICULTY, DIFFICULTIES, getDifficulty } from '../game/difficulty';
import { collectLegalPairs } from '../game/question';
import type { DifficultyId, GameConfig, Movie } from '../game/types';

export interface HomeScreenProps {
  readonly movies: readonly Movie[];
  readonly disclaimer: string;
  readonly initialConfig: GameConfig;
  readonly onStart: (config: GameConfig) => void;
}

function parseYear(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d{4}$/.test(trimmed)) return null;
  return Number(trimmed);
}

export function HomeScreen({ movies, disclaimer, initialConfig, onStart }: HomeScreenProps) {
  const [difficulty, setDifficulty] = useState<DifficultyId>(
    initialConfig.difficulty ?? DEFAULT_DIFFICULTY,
  );
  const [fromText, setFromText] = useState(String(initialConfig.yearRange.from));
  const [toText, setToText] = useState(String(initialConfig.yearRange.to));

  const bounds = useMemo(() => {
    const years = movies.map((movie) => movie.year);
    if (years.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...years), max: Math.max(...years) };
  }, [movies]);

  const from = parseYear(fromText);
  const to = parseYear(toText);

  const rangeIsValid =
    from !== null && to !== null && from >= bounds.min && to <= bounds.max && from <= to;

  const pairCount = useMemo(() => {
    if (!rangeIsValid || from === null || to === null) return 0;
    return collectLegalPairs(movies, getDifficulty(difficulty), { from, to }).length;
  }, [difficulty, from, movies, rangeIsValid, to]);

  const errors: string[] = [];
  if (from === null || to === null) {
    errors.push('年份请填写 4 位数字。');
  } else if (from < bounds.min || to > bounds.max) {
    errors.push(`年份需在 ${bounds.min}–${bounds.max} 之间。`);
  } else if (from > to) {
    errors.push('起始年份不能晚于结束年份。');
  } else if (pairCount === 0) {
    errors.push('当前条件下没有合法题目，请调整难度或放宽年份范围。');
  }

  const canStart = errors.length === 0;

  const handleStart = () => {
    if (!canStart || from === null || to === null) return;
    onStart({ difficulty, yearRange: { from, to } });
  };

  return (
    <section className="screen">
      <header className="hero">
        <h1 className="hero__title">谁的评分更高？</h1>
        <p className="hero__subtitle">
          每一题给出两部电影：选对加一分，选错扣一条命，五条命用完游戏结束。
        </p>
      </header>

      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
          handleStart();
        }}
      >
        <fieldset className="field">
          <legend className="field__label">选择难度</legend>
          <div className="difficulty-grid">
            {DIFFICULTIES.map((item) => (
              <label
                key={item.id}
                className={`difficulty-card${difficulty === item.id ? ' difficulty-card--active' : ''}`}
              >
                <input
                  type="radio"
                  name="difficulty"
                  value={item.id}
                  checked={difficulty === item.id}
                  onChange={() => setDifficulty(item.id)}
                />
                <span className="difficulty-card__name">
                  {item.labelZh}
                  <span className="difficulty-card__en">{item.label}</span>
                </span>
                <span className="difficulty-card__hint">{item.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label className="field__label" htmlFor="year-from">
            起始年份
          </label>
          <div className="year-row">
            <input
              id="year-from"
              className="input"
              inputMode="numeric"
              value={fromText}
              onChange={(event) => setFromText(event.target.value)}
            />
            <span className="year-row__sep">至</span>
            <label className="field__label field__label--inline" htmlFor="year-to">
              结束年份
            </label>
            <input
              id="year-to"
              className="input"
              inputMode="numeric"
              value={toText}
              onChange={(event) => setToText(event.target.value)}
            />
          </div>
          <p className="field__hint">
            片库覆盖 {bounds.min}–{bounds.max} 年。
            {canStart ? `当前条件下有 ${pairCount} 个合法配对。` : ''}
          </p>
        </div>

        {errors.length > 0 ? (
          <ul className="errors" role="alert">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}

        <button type="submit" className="btn btn--primary btn--large" disabled={!canStart}>
          开始游戏
        </button>
      </form>

      <p className="disclaimer">{disclaimer}</p>
    </section>
  );
}

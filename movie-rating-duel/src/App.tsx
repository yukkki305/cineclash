import { useMemo, useState } from 'react';
import { GameScreen } from './components/GameScreen';
import { HomeScreen } from './components/HomeScreen';
import { ResultScreen } from './components/ResultScreen';
import { SYNTHETIC_DATA_DISCLAIMER, MOVIES } from './data/movies';
import { DEFAULT_DIFFICULTY } from './game/difficulty';
import {
  advanceQuestion,
  answerQuestion,
  createIdleState,
  restartGame,
  startGame,
} from './game/engine';
import type { GameConfig, GameState, Movie, Rng } from './game/types';

export interface AppProps {
  /** 可注入的片库，便于测试与未来接入真实数据源。 */
  readonly movies?: readonly Movie[];
  readonly disclaimer?: string;
  /** 可注入的随机源，测试中注入确定序列以获得稳定题目。 */
  readonly rng?: Rng;
}

export default function App({
  movies = MOVIES,
  disclaimer = SYNTHETIC_DATA_DISCLAIMER,
  rng = Math.random,
}: AppProps) {
  const [state, setState] = useState<GameState>(createIdleState);

  const initialConfig = useMemo<GameConfig>(() => {
    const years = movies.map((movie) => movie.year);
    const min = years.length > 0 ? Math.min(...years) : 2000;
    const max = years.length > 0 ? Math.max(...years) : 2025;
    return { difficulty: DEFAULT_DIFFICULTY, yearRange: { from: min, to: max } };
  }, [movies]);

  const handleStart = (config: GameConfig) => {
    setState((current) => startGame(current, config, movies, rng));
  };

  const handleAnswer = (movieId: string) => {
    setState((current) => answerQuestion(current, movieId));
  };

  const handleNext = () => {
    setState((current) => advanceQuestion(current, movies, rng));
  };

  const handleRestart = () => {
    setState((current) => restartGame(current, movies, rng));
  };

  const handleHome = () => {
    setState(createIdleState());
  };

  return (
    <main className="app">
      <div className="app__inner">
        {state.phase === 'idle' ? (
          <HomeScreen
            movies={movies}
            disclaimer={disclaimer}
            initialConfig={initialConfig}
            onStart={handleStart}
          />
        ) : state.phase === 'finished' ? (
          <ResultScreen
            state={state}
            disclaimer={disclaimer}
            onRestart={handleRestart}
            onHome={handleHome}
          />
        ) : (
          <GameScreen
            state={state}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onQuit={handleHome}
          />
        )}
      </div>
    </main>
  );
}

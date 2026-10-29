import type { Movie } from '../game/types';

export type CardStatus = 'idle' | 'correct' | 'wrong' | 'dim';

export interface MovieCardProps {
  readonly movie: Movie;
  readonly position: 'left' | 'right';
  /** 是否揭示评分与来源；作答前必须为 false，否则游戏就没有难度了。 */
  readonly reveal: boolean;
  readonly status: CardStatus;
  readonly disabled: boolean;
  readonly onSelect: () => void;
}

/** 缺图时的降级展示：取片名首字，保证布局不塌陷。 */
function posterFallback(title: string): string {
  return title.trim().slice(0, 1) || '影';
}

export function MovieCard({
  movie,
  position,
  reveal,
  status,
  disabled,
  onSelect,
}: MovieCardProps) {
  return (
    <button
      type="button"
      className={`movie-card movie-card--${status}`}
      onClick={onSelect}
      disabled={disabled}
      aria-label={`选择《${movie.title}》`}
      data-position={position}
    >
      <span className="movie-card__poster" aria-hidden="true">
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt="" />
        ) : (
          <span className="movie-card__poster-fallback">{posterFallback(movie.title)}</span>
        )}
      </span>

      <span className="movie-card__title">《{movie.title}》</span>
      <span className="movie-card__year">{movie.year}</span>

      {reveal ? (
        <span className="movie-card__rating">
          <span className="movie-card__rating-value">{movie.rating.toFixed(1)}</span>
          <span className="movie-card__rating-source">{movie.ratingSource}</span>
        </span>
      ) : (
        <span className="movie-card__rating movie-card__rating--hidden">评分已隐藏</span>
      )}

      {status === 'correct' ? <span className="movie-card__badge">正确答案</span> : null}
    </button>
  );
}

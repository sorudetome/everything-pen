import React from 'react';
import { StarIcon } from './icons';

export function StarRating({
  value,
  onChange,
  size = 18,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  const stars = [1, 2, 3, 4, 5];
  if (!onChange) {
    return (
      <div className="star-rating">
        {stars.map((s) => (
          <span key={s} className="star-btn">
            <StarIcon size={size} filled={s <= value} />
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="star-rating">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          className="star-btn"
          onClick={() => onChange(s)}
          aria-label={`${s} star${s > 1 ? 's' : ''}`}
        >
          <StarIcon size={size} filled={s <= value} />
        </button>
      ))}
    </div>
  );
}

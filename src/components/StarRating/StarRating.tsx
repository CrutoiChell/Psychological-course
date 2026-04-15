'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './StarRating.module.scss';

interface StarRatingProps {
  onRate: (rating: number) => void;
  disabled?: boolean;
}

export default function StarRating({ onRate, disabled }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);

  const handleClick = (rating: number) => {
    if (disabled) return;
    setSelected(rating);
    onRate(rating);
  };

  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map(i => {
        const active = i <= (hovered || selected);
        return (
          <button
            key={i}
            className={`${styles.star} ${active ? styles.active : ''} ${selected === i ? styles.selected : ''}`}
            onMouseEnter={() => !disabled && setHovered(i)}
            onMouseLeave={() => !disabled && setHovered(0)}
            onClick={() => handleClick(i)}
            disabled={disabled}
            aria-label={`${i} звезда`}
          >
            <Star
              size={32}
              fill={active ? '#f59e0b' : 'none'}
              stroke={active ? '#f59e0b' : 'currentColor'}
            />
          </button>
        );
      })}
    </div>
  );
}

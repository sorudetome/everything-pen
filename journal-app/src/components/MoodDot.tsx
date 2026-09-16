import React from 'react';
import type { Mood } from '../lib/types';

const MOOD_VAR: Record<Mood, string> = {
  1: 'var(--mood-1)',
  2: 'var(--mood-2)',
  3: 'var(--mood-3)',
  4: 'var(--mood-4)',
  5: 'var(--mood-5)',
};

export function MoodDot({ mood, size = 10 }: { mood: Mood | null; size?: number }) {
  return (
    <span
      className="mood-dot"
      style={{
        width: size,
        height: size,
        background: mood ? MOOD_VAR[mood] : 'var(--border)',
      }}
    />
  );
}

export function MoodPicker({
  value,
  onChange,
}: {
  value: Mood | null;
  onChange: (m: Mood) => void;
}) {
  const moods: Mood[] = [1, 2, 3, 4, 5];
  return (
    <div className="mood-picker">
      {moods.map((m) => (
        <button
          key={m}
          className={`mood-picker-dot${value === m ? ' selected' : ''}`}
          style={{ background: MOOD_VAR[m] }}
          aria-label={`Mood ${m}`}
          aria-pressed={value === m}
          onClick={() => onChange(m)}
        />
      ))}
    </div>
  );
}

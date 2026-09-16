import React from 'react';
import type { Entry, Mood } from '../lib/types';

const MOOD_VAR: Record<Mood, string> = {
  1: 'var(--mood-1)',
  2: 'var(--mood-2)',
  3: 'var(--mood-3)',
  4: 'var(--mood-4)',
  5: 'var(--mood-5)',
};

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function CalendarGrid({
  monthDate,
  onPrevMonth,
  onNextMonth,
  entries,
  selectedDate,
  onSelectDate,
}: {
  monthDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  entries: Entry[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const entryByDay = new Map<string, Mood | null>();
  for (const e of entries) {
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = dateKey(d);
      if (!entryByDay.has(key) || e.mood) entryByDay.set(key, e.mood);
    }
  }

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const monthLabel = monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="calendar-grid">
      <div className="calendar-nav">
        <button className="text-btn" onClick={onPrevMonth}>
          ‹
        </button>
        <span className="calendar-month-label">{monthLabel}</span>
        <button className="text-btn" onClick={onNextMonth}>
          ›
        </button>
      </div>
      <div className="calendar-weekdays">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="calendar-days">
        {cells.map((d, i) => {
          if (!d) return <span key={i} className="calendar-cell empty" />;
          const isToday = dateKey(d) === dateKey(today);
          const isSelected = dateKey(d) === dateKey(selectedDate);
          const mood = entryByDay.get(dateKey(d));
          const hasEntry = entryByDay.has(dateKey(d));
          return (
            <button
              key={i}
              className={`calendar-cell${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
              onClick={() => onSelectDate(d)}
            >
              <span>{d.getDate()}</span>
              {hasEntry && <span className="calendar-dot" style={{ background: mood ? MOOD_VAR[mood] : 'var(--text-tertiary)' }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

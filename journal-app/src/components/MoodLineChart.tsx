import React from 'react';
import { moodSeries } from '../lib/insights';
import type { Entry } from '../lib/types';

export function MoodLineChart({ entries }: { entries: Entry[] }) {
  const series = moodSeries(entries, 30);
  const w = 310;
  const h = 100;
  const padY = 10;
  const points = series
    .map((point, i) => {
      if (point.avgMood === null) return null;
      const x = (i / (series.length - 1)) * w;
      const y = h - padY - ((point.avgMood - 1) / 4) * (h - padY * 2);
      return { x, y };
    })
    .filter((p): p is { x: number; y: number } => p !== null);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg width={w} height={h} className="mood-chart">
      {points.length === 0 ? (
        <text x={w / 2} y={h / 2} textAnchor="middle" className="chart-empty-text">
          No mood data yet
        </text>
      ) : (
        <>
          <path d={path} fill="none" stroke="var(--accent)" strokeWidth={1.6} />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={2.2} fill="var(--accent)" />
          ))}
        </>
      )}
    </svg>
  );
}

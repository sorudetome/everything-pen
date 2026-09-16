import type { Entry } from './types';

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function dayStreak(entries: Entry[]): number {
  if (entries.length === 0) return 0;
  const days = new Set(entries.map((e) => startOfDay(new Date(e.date)).getTime()));
  let cursor = startOfDay(new Date());
  if (!days.has(cursor.getTime())) {
    cursor = new Date(cursor.getTime() - 86400000);
    if (!days.has(cursor.getTime())) return 0;
  }
  let streak = 0;
  while (days.has(cursor.getTime())) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
}

export function avgWords(entries: Entry[]): number {
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, e) => sum + (e.bodyText.trim() ? e.bodyText.trim().split(/\s+/).length : 0), 0);
  return Math.round(total / entries.length);
}

export function moodSeries(entries: Entry[], days = 30): { day: Date; avgMood: number | null }[] {
  const today = startOfDay(new Date());
  const series: { day: Date; avgMood: number | null }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today.getTime() - i * 86400000);
    const dayEntries = entries.filter((e) => startOfDay(new Date(e.date)).getTime() === day.getTime() && e.mood);
    const avgMood =
      dayEntries.length === 0
        ? null
        : dayEntries.reduce((sum, e) => sum + (e.mood ?? 0), 0) / dayEntries.length;
    series.push({ day, avgMood });
  }
  return series;
}

export function topTags(entries: Entry[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of entries) for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

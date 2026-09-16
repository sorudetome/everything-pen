import type { Entry } from './types';

export function groupByRecency(entries: Entry[]): { label: string; entries: Entry[] }[] {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(now);
  const yesterday = today - 86400000;
  const weekAgo = today - 6 * 86400000;

  const groups: Record<string, Entry[]> = { Today: [], Yesterday: [], 'This week': [], Earlier: [] };
  for (const e of entries) {
    const t = startOfDay(new Date(e.date));
    if (t === today) groups.Today.push(e);
    else if (t === yesterday) groups.Yesterday.push(e);
    else if (t >= weekAgo) groups['This week'].push(e);
    else groups.Earlier.push(e);
  }
  return Object.entries(groups)
    .filter(([, list]) => list.length > 0)
    .map(([label, list]) => ({ label, entries: list }));
}

import React, { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { SegmentedToggle } from '../components/SegmentedToggle';
import { CalendarGrid } from '../components/CalendarGrid';
import { EntryRow } from '../components/EntryRow';
import { Chip } from '../components/Chip';

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function Entries({ openEntry }: { openEntry: (id: string) => void }) {
  const { entries, allTags } = useStore();
  const [view, setView] = useState<'calendar' | 'tags'>('calendar');
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const dayEntries = useMemo(
    () => entries.filter((e) => sameDay(new Date(e.date), selectedDate)),
    [entries, selectedDate]
  );

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of allTags) counts.set(t, 0);
    for (const e of entries) for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return counts;
  }, [entries, allTags]);

  const filteredByTag = useMemo(
    () => (activeTag ? entries.filter((e) => e.tags.includes(activeTag)) : []),
    [entries, activeTag]
  );

  return (
    <div className="screen">
      <h1 className="screen-title">Entries</h1>

      <SegmentedToggle
        options={[
          { id: 'calendar', label: 'Calendar' },
          { id: 'tags', label: 'Tags' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'calendar' ? (
        <>
          <CalendarGrid
            monthDate={monthDate}
            onPrevMonth={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}
            onNextMonth={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}
            entries={entries}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <section className="section">
            <div className="section-label">
              {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            {dayEntries.length === 0 ? (
              <p className="empty-hint">No entries this day.</p>
            ) : (
              dayEntries.map((e) => <EntryRow key={e.id} entry={e} onOpen={openEntry} />)
            )}
          </section>
        </>
      ) : (
        <>
          <section className="section">
            {allTags.length === 0 ? (
              <p className="empty-hint">No tags yet.</p>
            ) : (
              <div className="chip-row">
                {allTags.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    count={tagCounts.get(t)}
                    variant={activeTag === t ? 'active' : 'suggested'}
                    onClick={() => setActiveTag(activeTag === t ? null : t)}
                  />
                ))}
              </div>
            )}
          </section>
          <section className="section">
            {activeTag ? (
              filteredByTag.length === 0 ? (
                <p className="empty-hint">No entries tagged “{activeTag}”.</p>
              ) : (
                filteredByTag.map((e) => <EntryRow key={e.id} entry={e} onOpen={openEntry} />)
              )
            ) : (
              <p className="empty-hint">Tap a tag to filter entries.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

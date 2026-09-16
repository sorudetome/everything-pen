import React from 'react';
import type { Entry } from '../lib/types';
import { formatDateTime } from '../lib/storage';
import { MoodDot } from './MoodDot';
import { Chip } from './Chip';

export function EntryRow({ entry, onOpen }: { entry: Entry; onOpen: (id: string) => void }) {
  return (
    <button className="entry-row" onClick={() => onOpen(entry.id)}>
      <div className="entry-row-top">
        <MoodDot mood={entry.mood} />
        <span className="entry-row-date">{formatDateTime(entry.date)}</span>
      </div>
      <p className="entry-row-preview">{entry.bodyText || '(no text — drawing only)'}</p>
      {entry.tags.length > 0 && (
        <div className="entry-row-tags">
          {entry.tags.map((t) => (
            <Chip key={t} label={t} variant="static" />
          ))}
        </div>
      )}
    </button>
  );
}

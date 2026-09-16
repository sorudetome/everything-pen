import React from 'react';
import { useStore } from '../lib/store';
import { formatFullDate } from '../lib/storage';
import { MoodDot } from '../components/MoodDot';
import { Chip } from '../components/Chip';
import { ConfirmDelete } from '../components/ConfirmDelete';
import type { ScreenId } from '../lib/types';

export function EntryDetail({
  entryId,
  navigate,
  onEdit,
}: {
  entryId: string | null;
  navigate: (s: ScreenId) => void;
  onEdit: (id: string) => void;
}) {
  const { entries, deleteEntry } = useStore();
  const entry = entries.find((e) => e.id === entryId);

  if (!entry) {
    return (
      <div className="screen">
        <button className="back-link" onClick={() => navigate('entries')}>
          ‹ Entries
        </button>
        <p className="empty-hint">Entry not found.</p>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-title-row">
        <button className="back-link" onClick={() => navigate('entries')}>
          ‹ Entries
        </button>
        <div className="detail-actions">
          <button className="text-btn" onClick={() => onEdit(entry.id)}>
            Edit
          </button>
          <ConfirmDelete
            onConfirm={() => {
              deleteEntry(entry.id);
              navigate('entries');
            }}
          />
        </div>
      </div>

      <div className="entry-detail-header">
        <MoodDot mood={entry.mood} size={12} />
        <h1 className="screen-title entry-detail-date">{formatFullDate(entry.date)}</h1>
      </div>

      <p className="entry-detail-text">{entry.bodyText}</p>

      {entry.tags.length > 0 && (
        <div className="chip-row">
          {entry.tags.map((t) => (
            <Chip key={t} label={t} variant="static" />
          ))}
        </div>
      )}

      {entry.drawing && entry.drawing.dataUrl && (
        <section className="section">
          <div className="section-label">Drawing</div>
          <img className="entry-drawing" src={entry.drawing.dataUrl} alt="Entry drawing" />
        </section>
      )}
    </div>
  );
}

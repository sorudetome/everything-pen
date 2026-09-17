import React, { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import type { ExportSnapshot } from '../lib/store';
import { groupByRecency } from '../lib/grouping';
import { EntryRow } from '../components/EntryRow';
import type { ScreenId } from '../lib/types';

function isSnapshot(data: unknown): data is ExportSnapshot {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.entries) &&
    Array.isArray(d.quotes) &&
    Array.isArray(d.storageItems) &&
    Array.isArray(d.images)
  );
}

function BackupSection() {
  const { exportSnapshot, importSnapshot } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ExportSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  function handleExport() {
    const snapshot = exportSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `journal-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setError(null);
    setImported(false);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!isSnapshot(parsed)) {
          setError('That file doesn’t look like a journal backup.');
          return;
        }
        setPending(parsed);
      } catch {
        setError('Could not read that file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <section className="section">
      <div className="section-label">Backup</div>
      <div className="card backup-card">
        <div className="backup-row">
          <p className="backup-hint">Save everything to a file, or load a previous backup.</p>
        </div>
        <div className="backup-actions">
          <button className="secondary-btn" onClick={handleExport}>
            Export data
          </button>
          {!pending && (
            <button className="secondary-btn" onClick={() => fileInputRef.current?.click()}>
              Import data
            </button>
          )}
        </div>
        {pending && (
          <div className="confirm-delete backup-confirm">
            <span className="confirm-delete-label">Replace everything on this device with this file?</span>
            <button
              className="text-btn danger"
              onClick={() => {
                importSnapshot(pending);
                setPending(null);
                setImported(true);
              }}
            >
              Yes
            </button>
            <button className="text-btn" onClick={() => setPending(null)}>
              No
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => handleFile(e.target.files)}
        />
        {error && <p className="lock-error backup-message">{error}</p>}
        {imported && <p className="backup-message backup-success">Imported.</p>}
      </div>
    </section>
  );
}

export function Home({
  navigate,
  openEntry,
}: {
  navigate: (s: ScreenId) => void;
  openEntry: (id: string) => void;
}) {
  const { entries, featuredQuote, featuredImage } = useStore();
  const groups = groupByRecency(entries).slice(0, 2);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="screen">
      <h1 className="screen-title">{today}</h1>

      <section className="section">
        <div className="section-label">Today's words</div>
        <button className="card quote-card" onClick={() => navigate('words')}>
          {featuredQuote ? (
            <>
              <p className="quote-text">“{featuredQuote.text}”</p>
              {featuredQuote.source && <p className="quote-source">— {featuredQuote.source}</p>}
            </>
          ) : (
            <p className="empty-hint">Keep a quote to see it here.</p>
          )}
        </button>
      </section>

      <section className="section">
        <div className="section-label">Today's image</div>
        <button className="card image-hero" onClick={() => navigate('images')}>
          {featuredImage ? (
            <img src={featuredImage.dataUrl} alt="" />
          ) : (
            <p className="empty-hint">Add an image to see it here.</p>
          )}
        </button>
      </section>

      <section className="section">
        <div className="section-row">
          <div className="section-label">Recent entries</div>
          <button className="see-all" onClick={() => navigate('entries')}>
            See all
          </button>
        </div>
        {groups.length === 0 && <p className="empty-hint">No entries yet. Tap New to write one.</p>}
        {groups.map((group) => (
          <div key={group.label} className="entry-group">
            <div className="entry-group-label">{group.label}</div>
            {group.entries.map((e) => (
              <EntryRow key={e.id} entry={e} onOpen={openEntry} />
            ))}
          </div>
        ))}
      </section>

      <BackupSection />
    </div>
  );
}

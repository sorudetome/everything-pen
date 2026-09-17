import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { formatDateTime } from '../lib/storage';
import { linkify } from '../lib/linkify';
import { ConfirmDelete } from '../components/ConfirmDelete';
import type { StorageItem } from '../lib/types';

function StorageRow({
  item,
  onSave,
  onDelete,
}: {
  item: StorageItem;
  onSave: (content: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(item.content);

  if (editing) {
    return (
      <div className="storage-item storage-edit">
        <span className="storage-date">{formatDateTime(item.addedAt)}</span>
        <textarea className="field textarea" rows={2} value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="quote-item-actions">
          <button
            className="text-btn"
            disabled={!content.trim()}
            onClick={() => {
              onSave(content.trim());
              setEditing(false);
            }}
          >
            Save
          </button>
          <button
            className="text-btn"
            onClick={() => {
              setContent(item.content);
              setEditing(false);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="storage-item">
      <span className="storage-date">{formatDateTime(item.addedAt)}</span>
      <p className="storage-content">{linkify(item.content)}</p>
      <div className="quote-item-actions">
        <button className="text-btn" onClick={() => setEditing(true)}>
          Edit
        </button>
        <ConfirmDelete onConfirm={onDelete} />
      </div>
    </div>
  );
}

export function Storage() {
  const { storageItems, addStorageItem, updateStorageItem, deleteStorageItem } = useStore();
  const [draft, setDraft] = useState('');

  const save = () => {
    if (!draft.trim()) return;
    addStorageItem(draft.trim());
    setDraft('');
  };

  return (
    <div className="screen">
      <h1 className="screen-title">Storage</h1>

      <section className="section">
        <div className="card new-quote-card">
          <textarea
            className="field textarea"
            rows={3}
            placeholder="Paste a link, or drop in anything worth keeping"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="primary-btn" disabled={!draft.trim()} onClick={save}>
            Save it
          </button>
        </div>
      </section>

      <section className="section">
        {storageItems.length === 0 ? (
          <p className="empty-hint">Nothing saved yet.</p>
        ) : (
          <div className="storage-list">
            {storageItems.map((item) => (
              <StorageRow
                key={item.id}
                item={item}
                onSave={(content) => updateStorageItem(item.id, content)}
                onDelete={() => deleteStorageItem(item.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

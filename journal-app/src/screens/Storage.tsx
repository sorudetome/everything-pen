import React, { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { formatDateTime } from '../lib/storage';
import { linkify } from '../lib/linkify';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { SegmentedToggle } from '../components/SegmentedToggle';
import { Chip } from '../components/Chip';
import type { StorageItem } from '../lib/types';

function TagEditor({
  activeTags,
  suggestedTags,
  onAdd,
  onRemove,
}: {
  activeTags: string[];
  suggestedTags: string[];
  onAdd: (t: string) => void;
  onRemove: (t: string) => void;
}) {
  const [newTag, setNewTag] = useState('');
  return (
    <div className="storage-tag-editor">
      {activeTags.length > 0 && (
        <div className="chip-row">
          {activeTags.map((t) => (
            <Chip key={t} label={t} variant="active" onClick={() => onRemove(t)} />
          ))}
        </div>
      )}
      {suggestedTags.length > 0 && (
        <div className="chip-row">
          {suggestedTags.map((t) => (
            <Chip key={t} label={t} variant="suggested" onClick={() => onAdd(t)} />
          ))}
        </div>
      )}
      <div className="tag-add-row">
        <input
          className="field tag-input"
          placeholder="add a tag"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAdd(newTag);
              setNewTag('');
            }
          }}
        />
        <button
          className="text-btn"
          onClick={() => {
            onAdd(newTag);
            setNewTag('');
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function StorageRow({
  item,
  allStorageTags,
  onSave,
  onDelete,
}: {
  item: StorageItem;
  allStorageTags: string[];
  onSave: (content: string, tags: string[]) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(item.content);
  const [tags, setTags] = useState<string[]>(item.tags ?? []);
  const itemTags = item.tags ?? [];

  function addTag(t: string) {
    if (!t.trim() || tags.includes(t.trim())) return;
    setTags((prev) => [...prev, t.trim()]);
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  if (editing) {
    return (
      <div className="storage-item storage-edit">
        <span className="storage-date">{formatDateTime(item.addedAt)}</span>
        <textarea className="field textarea" rows={2} value={content} onChange={(e) => setContent(e.target.value)} />
        <TagEditor
          activeTags={tags}
          suggestedTags={allStorageTags.filter((t) => !tags.includes(t))}
          onAdd={addTag}
          onRemove={removeTag}
        />
        <div className="quote-item-actions">
          <button
            className="text-btn"
            disabled={!content.trim()}
            onClick={() => {
              onSave(content.trim(), tags);
              setEditing(false);
            }}
          >
            Save
          </button>
          <button
            className="text-btn"
            onClick={() => {
              setContent(item.content);
              setTags(itemTags);
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
      {itemTags.length > 0 && (
        <div className="entry-row-tags">
          {itemTags.map((t) => (
            <Chip key={t} label={t} variant="static" />
          ))}
        </div>
      )}
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
  const { storageItems, addStorageItem, updateStorageItem, deleteStorageItem, allStorageTags } = useStore();
  const [draft, setDraft] = useState('');
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [view, setView] = useState<'all' | 'tags'>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const save = () => {
    if (!draft.trim()) return;
    addStorageItem(draft.trim(), draftTags);
    setDraft('');
    setDraftTags([]);
  };

  function addDraftTag(t: string) {
    if (!t.trim() || draftTags.includes(t.trim())) return;
    setDraftTags((prev) => [...prev, t.trim()]);
  }

  function removeDraftTag(t: string) {
    setDraftTags((prev) => prev.filter((x) => x !== t));
  }

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of allStorageTags) counts.set(t, 0);
    for (const s of storageItems) for (const t of s.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
    return counts;
  }, [storageItems, allStorageTags]);

  const filteredByTag = useMemo(
    () => (activeTag ? storageItems.filter((s) => (s.tags ?? []).includes(activeTag)) : []),
    [storageItems, activeTag]
  );

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
          <TagEditor
            activeTags={draftTags}
            suggestedTags={allStorageTags.filter((t) => !draftTags.includes(t))}
            onAdd={addDraftTag}
            onRemove={removeDraftTag}
          />
          <button className="primary-btn" disabled={!draft.trim()} onClick={save}>
            Save it
          </button>
        </div>
      </section>

      <SegmentedToggle
        options={[
          { id: 'all', label: 'All' },
          { id: 'tags', label: 'Tags' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'tags' ? (
        <>
          <section className="section">
            {allStorageTags.length === 0 ? (
              <p className="empty-hint">No tags yet.</p>
            ) : (
              <div className="chip-row">
                {allStorageTags.map((t) => (
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
                <p className="empty-hint">Nothing tagged “{activeTag}”.</p>
              ) : (
                <div className="storage-list">
                  {filteredByTag.map((item) => (
                    <StorageRow
                      key={item.id}
                      item={item}
                      allStorageTags={allStorageTags}
                      onSave={(content, tags) => updateStorageItem(item.id, content, tags)}
                      onDelete={() => deleteStorageItem(item.id)}
                    />
                  ))}
                </div>
              )
            ) : (
              <p className="empty-hint">Tap a tag to filter.</p>
            )}
          </section>
        </>
      ) : (
        <section className="section">
          {storageItems.length === 0 ? (
            <p className="empty-hint">Nothing saved yet.</p>
          ) : (
            <div className="storage-list">
              {storageItems.map((item) => (
                <StorageRow
                  key={item.id}
                  item={item}
                  allStorageTags={allStorageTags}
                  onSave={(content, tags) => updateStorageItem(item.id, content, tags)}
                  onDelete={() => deleteStorageItem(item.id)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

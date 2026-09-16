import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { MoodPicker } from '../components/MoodDot';
import { SegmentedToggle } from '../components/SegmentedToggle';
import { Chip } from '../components/Chip';
import { DrawPad } from '../components/DrawPad';
import type { DrawingStroke, Mood, ScreenId } from '../lib/types';

export function NewEntry({
  navigate,
  editEntryId,
}: {
  navigate: (s: ScreenId) => void;
  editEntryId?: string | null;
}) {
  const { entries, addEntry, updateEntry, allTags, nextPlaceholder } = useStore();
  const editingEntry = editEntryId ? entries.find((e) => e.id === editEntryId) ?? null : null;

  const [mode, setMode] = useState<'write' | 'draw'>(editingEntry?.drawing ? 'draw' : 'write');
  const [mood, setMood] = useState<Mood | null>(editingEntry?.mood ?? null);
  const [text, setText] = useState(editingEntry?.bodyText ?? '');
  const [activeTags, setActiveTags] = useState<string[]>(editingEntry?.tags ?? []);
  const [newTag, setNewTag] = useState('');
  const [strokes, setStrokes] = useState<DrawingStroke[]>(editingEntry?.drawing?.strokes ?? []);
  const [drawingDataUrl, setDrawingDataUrl] = useState(editingEntry?.drawing?.dataUrl ?? '');

  const [placeholder, setPlaceholder] = useState('');
  useEffect(() => {
    setPlaceholder(nextPlaceholder());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suggestedTags = allTags.filter((t) => !activeTags.includes(t));
  const wordCount = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;

  function addActiveTag(t: string) {
    if (!t.trim() || activeTags.includes(t.trim())) return;
    setActiveTags((prev) => [...prev, t.trim()]);
  }

  function removeActiveTag(t: string) {
    setActiveTags((prev) => prev.filter((x) => x !== t));
  }

  function save() {
    const data = {
      bodyText: text.trim(),
      mood,
      tags: activeTags,
      drawing: strokes.length > 0 ? { strokes, dataUrl: drawingDataUrl } : null,
    };
    if (editingEntry) {
      updateEntry(editingEntry.id, data);
      navigate('entryDetail');
    } else {
      addEntry(data);
      navigate('home');
    }
  }

  const canSave = text.trim().length > 0 || strokes.length > 0;

  return (
    <div className="screen">
      <h1 className="screen-title">
        {editingEntry
          ? 'Edit entry'
          : new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </h1>

      <section className="section">
        <div className="section-label">Mood?</div>
        <MoodPicker value={mood} onChange={setMood} />
      </section>

      <section className="section">
        <SegmentedToggle
          options={[
            { id: 'write', label: 'Write' },
            { id: 'draw', label: 'Draw' },
          ]}
          value={mode}
          onChange={setMode}
        />
        {mode === 'write' ? (
          <textarea
            className="field textarea entry-textarea"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <DrawPad
            strokes={strokes}
            onChange={(s, dataUrl) => {
              setStrokes(s);
              setDrawingDataUrl(dataUrl);
            }}
          />
        )}
      </section>

      <section className="section">
        <div className="section-label">Tags</div>
        <div className="chip-row">
          {activeTags.map((t) => (
            <Chip key={t} label={t} variant="active" onClick={() => removeActiveTag(t)} />
          ))}
        </div>
        {suggestedTags.length > 0 && (
          <div className="chip-row">
            {suggestedTags.map((t) => (
              <Chip key={t} label={t} variant="suggested" onClick={() => addActiveTag(t)} />
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
                addActiveTag(newTag);
                setNewTag('');
              }
            }}
          />
          <button
            className="text-btn"
            onClick={() => {
              addActiveTag(newTag);
              setNewTag('');
            }}
          >
            Add
          </button>
        </div>
      </section>

      <footer className="entry-footer">
        <span className="word-count">{wordCount} words</span>
        <button className="primary-btn" disabled={!canSave} onClick={save}>
          {editingEntry ? 'Save changes' : 'Save entry'}
        </button>
      </footer>
    </div>
  );
}

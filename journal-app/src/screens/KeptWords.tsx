import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { ConfirmDelete } from '../components/ConfirmDelete';
import type { Quote } from '../lib/types';

function QuoteListItem({
  quote,
  onSave,
  onDelete,
}: {
  quote: Quote;
  onSave: (text: string, source: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(quote.text);
  const [source, setSource] = useState(quote.source);

  if (editing) {
    return (
      <div className="quote-list-item quote-edit">
        <textarea className="field textarea" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <input className="field" value={source} onChange={(e) => setSource(e.target.value)} />
        <div className="quote-item-actions">
          <button
            className="text-btn"
            disabled={!text.trim()}
            onClick={() => {
              onSave(text.trim(), source.trim());
              setEditing(false);
            }}
          >
            Save
          </button>
          <button
            className="text-btn"
            onClick={() => {
              setText(quote.text);
              setSource(quote.source);
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
    <div className="quote-list-item">
      <p className="quote-text">“{quote.text}”</p>
      {quote.source && <p className="quote-source">— {quote.source}</p>}
      <div className="quote-item-actions">
        <button className="text-btn" onClick={() => setEditing(true)}>
          Edit
        </button>
        <ConfirmDelete onConfirm={onDelete} />
      </div>
    </div>
  );
}

export function KeptWords() {
  const { quotes, addQuote, updateQuote, deleteQuote, featuredQuote } = useStore();
  const [text, setText] = useState('');
  const [source, setSource] = useState('');

  const canSave = text.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    addQuote(text.trim(), source.trim());
    setText('');
    setSource('');
  };

  return (
    <div className="screen">
      <h1 className="screen-title">Kept words</h1>

      <section className="section">
        <div className="card new-quote-card">
          <textarea
            className="field textarea"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            className="field"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <button className="primary-btn" disabled={!canSave} onClick={save}>
            Keep this
          </button>
        </div>
      </section>

      {featuredQuote && (
        <section className="section">
          <div className="section-label">Today's words</div>
          <div className="card quote-card">
            <p className="quote-text">“{featuredQuote.text}”</p>
            {featuredQuote.source && <p className="quote-source">— {featuredQuote.source}</p>}
          </div>
        </section>
      )}

      <section className="section">
        {quotes.length === 0 ? (
          <p className="empty-hint">No quotes kept yet.</p>
        ) : (
          <div className="quote-list">
            {quotes.map((q) => (
              <QuoteListItem
                key={q.id}
                quote={q}
                onSave={(t, s) => updateQuote(q.id, t, s)}
                onDelete={() => deleteQuote(q.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

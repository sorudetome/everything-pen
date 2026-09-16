import React, { useState } from 'react';
import { useStore } from '../lib/store';

export function KeptWords() {
  const { quotes, addQuote, featuredQuote } = useStore();
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
              <div key={q.id} className="quote-list-item">
                <p className="quote-text">“{q.text}”</p>
                {q.source && <p className="quote-source">— {q.source}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

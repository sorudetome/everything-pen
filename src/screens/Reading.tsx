import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { StarRating } from '../components/StarRating';
import { formatDateTime } from '../lib/storage';

export function Reading() {
  const { currentBook, finishedBooks, startBook, setBookRating, addBookNote, finishBook } = useStore();
  const [thought, setThought] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="screen">
      <h1 className="screen-title">Reading</h1>

      <section className="section">
        <div className="section-label">Currently reading</div>
        {currentBook ? (
          <div className="card book-card">
            <p className="book-title">{currentBook.title}</p>
            <p className="book-author">{currentBook.author}</p>
            <StarRating value={currentBook.rating} onChange={(v) => setBookRating(currentBook.id, v)} />

            <div className="thought-list">
              {currentBook.notes.length === 0 ? (
                <p className="empty-hint">No thoughts logged yet.</p>
              ) : (
                currentBook.notes.map((n) => (
                  <div key={n.id} className="thought-item">
                    <span className="thought-date">{formatDateTime(n.date)}</span>
                    <p className="thought-text">{n.text}</p>
                  </div>
                ))
              )}
            </div>

            <textarea
              className="field textarea"
              rows={2}
              placeholder="Log a thought"
              value={thought}
              onChange={(e) => setThought(e.target.value)}
            />
            <button
              className="text-btn"
              disabled={!thought.trim()}
              onClick={() => {
                addBookNote(currentBook.id, thought.trim());
                setThought('');
              }}
            >
              Add thought
            </button>

            <button className="secondary-btn" onClick={() => finishBook(currentBook.id)}>
              Finish book
            </button>
          </div>
        ) : (
          <div className="card book-card">
            <p className="empty-hint">No book in progress. Start one:</p>
            <input
              className="field"
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <input
              className="field"
              placeholder="Author"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
            />
            <button
              className="primary-btn"
              disabled={!newTitle.trim()}
              onClick={() => {
                startBook(newTitle.trim(), newAuthor.trim());
                setNewTitle('');
                setNewAuthor('');
              }}
            >
              Start reading
            </button>
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-label">Finished</div>
        {finishedBooks.length === 0 ? (
          <p className="empty-hint">No finished books yet.</p>
        ) : (
          <div className="accordion">
            {finishedBooks.map((b) => {
              const isOpen = expanded === b.id;
              return (
                <div key={b.id} className="accordion-item">
                  <button className="accordion-row" onClick={() => setExpanded(isOpen ? null : b.id)}>
                    <div>
                      <p className="book-title">{b.title}</p>
                      <p className="book-author">{b.author}</p>
                    </div>
                    <StarRating value={b.rating} size={14} />
                  </button>
                  {isOpen && (
                    <div className="thought-list expanded">
                      {b.notes.length === 0 ? (
                        <p className="empty-hint">No thoughts logged.</p>
                      ) : (
                        b.notes.map((n) => (
                          <div key={n.id} className="thought-item">
                            <span className="thought-date">{formatDateTime(n.date)}</span>
                            <p className="thought-text">{n.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

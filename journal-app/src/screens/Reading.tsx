import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { StarRating } from '../components/StarRating';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { formatDateTime } from '../lib/storage';
import type { Book, BookNote } from '../lib/types';

function ThoughtItem({
  note,
  onSave,
  onDelete,
}: {
  note: BookNote;
  onSave: (text: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);

  if (editing) {
    return (
      <div className="thought-item thought-edit">
        <span className="thought-date">{formatDateTime(note.date)}</span>
        <textarea className="field textarea" rows={2} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="quote-item-actions">
          <button
            className="text-btn"
            disabled={!text.trim()}
            onClick={() => {
              onSave(text.trim());
              setEditing(false);
            }}
          >
            Save
          </button>
          <button
            className="text-btn"
            onClick={() => {
              setText(note.text);
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
    <div className="thought-item">
      <span className="thought-date">{formatDateTime(note.date)}</span>
      <p className="thought-text">{note.text}</p>
      <div className="quote-item-actions">
        <button className="text-btn" onClick={() => setEditing(true)}>
          Edit
        </button>
        <ConfirmDelete onConfirm={onDelete} />
      </div>
    </div>
  );
}

function BookHeader({
  book,
  onSave,
  onDelete,
  hideDisplay,
}: {
  book: Book;
  onSave: (title: string, author: string) => void;
  onDelete: () => void;
  hideDisplay?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);

  if (editing) {
    return (
      <div className="book-edit">
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <input className="field" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" />
        <div className="quote-item-actions">
          <button
            className="text-btn"
            disabled={!title.trim()}
            onClick={() => {
              onSave(title.trim(), author.trim());
              setEditing(false);
            }}
          >
            Save
          </button>
          <button
            className="text-btn"
            onClick={() => {
              setTitle(book.title);
              setAuthor(book.author);
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
    <div className="book-header-row">
      {!hideDisplay && (
        <div>
          <p className="book-title">{book.title}</p>
          <p className="book-author">{book.author}</p>
        </div>
      )}
      <div className="quote-item-actions">
        <button className="text-btn" onClick={() => setEditing(true)}>
          Edit book
        </button>
        <ConfirmDelete onConfirm={onDelete} label="Delete book" />
      </div>
    </div>
  );
}

export function Reading() {
  const {
    currentBook,
    finishedBooks,
    startBook,
    setBookRating,
    addBookNote,
    updateBookNote,
    deleteBookNote,
    updateBook,
    deleteBook,
    finishBook,
  } = useStore();
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
            <BookHeader
              book={currentBook}
              onSave={(title, author) => updateBook(currentBook.id, title, author)}
              onDelete={() => deleteBook(currentBook.id)}
            />
            <StarRating value={currentBook.rating} onChange={(v) => setBookRating(currentBook.id, v)} />

            <div className="thought-list">
              {currentBook.notes.length === 0 ? (
                <p className="empty-hint">No thoughts logged yet.</p>
              ) : (
                currentBook.notes.map((n) => (
                  <ThoughtItem
                    key={n.id}
                    note={n}
                    onSave={(text) => updateBookNote(currentBook.id, n.id, text)}
                    onDelete={() => deleteBookNote(currentBook.id, n.id)}
                  />
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
                  <div
                    className="accordion-row"
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpanded(isOpen ? null : b.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setExpanded(isOpen ? null : b.id);
                    }}
                  >
                    <div>
                      <p className="book-title">{b.title}</p>
                      <p className="book-author">{b.author}</p>
                    </div>
                    <StarRating value={b.rating} size={14} />
                  </div>
                  {isOpen && (
                    <div className="thought-list expanded">
                      <BookHeader
                        book={b}
                        hideDisplay
                        onSave={(title, author) => updateBook(b.id, title, author)}
                        onDelete={() => deleteBook(b.id)}
                      />
                      {b.notes.length === 0 ? (
                        <p className="empty-hint">No thoughts logged.</p>
                      ) : (
                        b.notes.map((n) => (
                          <ThoughtItem
                            key={n.id}
                            note={n}
                            onSave={(text) => updateBookNote(b.id, n.id, text)}
                            onDelete={() => deleteBookNote(b.id, n.id)}
                          />
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

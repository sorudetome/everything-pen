import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import type {
  Book,
  BookNote,
  Drawing,
  Entry,
  ImageItem,
  Mood,
  Quote,
  QuoteFeatureLog,
} from './types';
import { todayISODate, uid, useLocalStorage } from './storage';

export const PLACEHOLDERS = [
  'Defy, defy, defy.',
  "Longest way round's the fastest way home.",
  'Your truest true is sun gilded.',
  'What is refuge?',
  'Why prevaricate?',
  'Heaven in familiar seeds.',
  'Weighed and found...',
];

interface StoreShape {
  entries: Entry[];
  quotes: Quote[];
  books: Book[];
  images: ImageItem[];
  featuredLog: QuoteFeatureLog[];
  placeholderIndex: number;

  addEntry: (data: { bodyText: string; mood: Mood | null; tags: string[]; drawing: Drawing | null }) => Entry;
  updateEntry: (id: string, data: { bodyText: string; mood: Mood | null; tags: string[]; drawing: Drawing | null }) => void;
  deleteEntry: (id: string) => void;
  addQuote: (text: string, source: string) => void;
  updateQuote: (id: string, text: string, source: string) => void;
  deleteQuote: (id: string) => void;
  featuredQuote: Quote | null;

  currentBook: Book | null;
  finishedBooks: Book[];
  startBook: (title: string, author: string) => void;
  setBookRating: (bookId: string, rating: number) => void;
  addBookNote: (bookId: string, text: string) => void;
  updateBookNote: (bookId: string, noteId: string, text: string) => void;
  deleteBookNote: (bookId: string, noteId: string) => void;
  updateBook: (bookId: string, title: string, author: string) => void;
  deleteBook: (bookId: string) => void;
  finishBook: (bookId: string) => void;

  addImages: (dataUrls: string[]) => void;
  updateImagePosition: (
    id: string,
    position: Partial<ImageItem['position']> | ((prev: ImageItem['position']) => Partial<ImageItem['position']>)
  ) => void;
  deleteImage: (id: string) => void;

  nextPlaceholder: () => string;
  allTags: string[];
}

const StoreContext = createContext<StoreShape | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useLocalStorage<Entry[]>('journal.entries', []);
  const [quotes, setQuotes] = useLocalStorage<Quote[]>('journal.quotes', []);
  const [books, setBooks] = useLocalStorage<Book[]>('journal.books', []);
  const [images, setImages] = useLocalStorage<ImageItem[]>('journal.images', []);
  const [featuredLog, setFeaturedLog] = useLocalStorage<QuoteFeatureLog[]>('journal.featuredLog', []);
  const [placeholderIndex, setPlaceholderIndex] = useLocalStorage<number>('journal.placeholderIndex', -1);

  const addEntry: StoreShape['addEntry'] = useCallback(
    (data) => {
      const entry: Entry = {
        id: uid(),
        date: new Date().toISOString(),
        bodyText: data.bodyText,
        mood: data.mood,
        tags: data.tags,
        drawing: data.drawing,
      };
      setEntries((prev) => [entry, ...prev]);
      return entry;
    },
    [setEntries]
  );

  const updateEntry: StoreShape['updateEntry'] = useCallback(
    (id, data) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, bodyText: data.bodyText, mood: data.mood, tags: data.tags, drawing: data.drawing } : e
        )
      );
    },
    [setEntries]
  );

  const deleteEntry: StoreShape['deleteEntry'] = useCallback(
    (id) => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [setEntries]
  );

  const addQuote: StoreShape['addQuote'] = useCallback(
    (text, source) => {
      const quote: Quote = { id: uid(), text, source, keptAt: new Date().toISOString() };
      setQuotes((prev) => [quote, ...prev]);
    },
    [setQuotes]
  );

  const updateQuote: StoreShape['updateQuote'] = useCallback(
    (id, text, source) => {
      setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, text, source } : q)));
    },
    [setQuotes]
  );

  const deleteQuote: StoreShape['deleteQuote'] = useCallback(
    (id) => {
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      setFeaturedLog((prev) => prev.filter((f) => f.quoteId !== id));
    },
    [setQuotes, setFeaturedLog]
  );

  useEffect(() => {
    if (quotes.length === 0) return;
    const today = todayISODate();
    if (featuredLog.some((f) => f.date === today)) return;
    const recentWindow = Math.max(0, featuredLog.length - Math.min(quotes.length - 1, 5));
    const recentlyUsed = new Set(featuredLog.slice(recentWindow).map((f) => f.quoteId));
    let candidates = quotes.filter((q) => !recentlyUsed.has(q.id));
    if (candidates.length === 0) candidates = quotes;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    setFeaturedLog((prev) => [...prev.filter((f) => f.date !== today), { date: today, quoteId: pick.id }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes.length, featuredLog.length]);

  const featuredQuote = useMemo(() => {
    if (quotes.length === 0) return null;
    const today = todayISODate();
    const existing = featuredLog.find((f) => f.date === today);
    if (existing) {
      const q = quotes.find((q) => q.id === existing.quoteId);
      if (q) return q;
    }
    return quotes[0];
  }, [quotes, featuredLog]);

  const currentBook = useMemo(() => books.find((b) => b.status === 'reading') ?? null, [books]);
  const finishedBooks = useMemo(
    () => books.filter((b) => b.status === 'finished').sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? '')),
    [books]
  );

  const startBook: StoreShape['startBook'] = useCallback(
    (title, author) => {
      setBooks((prev) => [
        ...prev,
        {
          id: uid(),
          title,
          author,
          rating: 0,
          status: 'reading',
          notes: [],
          startedAt: new Date().toISOString(),
          finishedAt: null,
        },
      ]);
    },
    [setBooks]
  );

  const setBookRating: StoreShape['setBookRating'] = useCallback(
    (bookId, rating) => {
      setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, rating } : b)));
    },
    [setBooks]
  );

  const addBookNote: StoreShape['addBookNote'] = useCallback(
    (bookId, text) => {
      const note: BookNote = { id: uid(), date: new Date().toISOString(), text };
      setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, notes: [note, ...b.notes] } : b)));
    },
    [setBooks]
  );

  const updateBookNote: StoreShape['updateBookNote'] = useCallback(
    (bookId, noteId, text) => {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId ? { ...b, notes: b.notes.map((n) => (n.id === noteId ? { ...n, text } : n)) } : b
        )
      );
    },
    [setBooks]
  );

  const deleteBookNote: StoreShape['deleteBookNote'] = useCallback(
    (bookId, noteId) => {
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, notes: b.notes.filter((n) => n.id !== noteId) } : b))
      );
    },
    [setBooks]
  );

  const updateBook: StoreShape['updateBook'] = useCallback(
    (bookId, title, author) => {
      setBooks((prev) => prev.map((b) => (b.id === bookId ? { ...b, title, author } : b)));
    },
    [setBooks]
  );

  const deleteBook: StoreShape['deleteBook'] = useCallback(
    (bookId) => {
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    },
    [setBooks]
  );

  const finishBook: StoreShape['finishBook'] = useCallback(
    (bookId) => {
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, status: 'finished', finishedAt: new Date().toISOString() } : b))
      );
    },
    [setBooks]
  );

  const addImages: StoreShape['addImages'] = useCallback(
    (dataUrls) => {
      setImages((prev) => {
        const startIndex = prev.length;
        const columns = 3;
        const additions: ImageItem[] = dataUrls.map((dataUrl, i) => {
          const n = startIndex + i;
          const col = n % columns;
          const row = Math.floor(n / columns);
          return {
            id: uid(),
            dataUrl,
            uploadedAt: new Date().toISOString(),
            sortIndex: n,
            position: {
              x: 16 + col * 125 + ((n * 13) % 20),
              y: 16 + row * 130 + ((n * 19) % 20),
              rotation: (((n * 17) % 20) - 10),
              scale: 1,
            },
          };
        });
        return [...additions, ...prev];
      });
    },
    [setImages]
  );

  const updateImagePosition: StoreShape['updateImagePosition'] = useCallback(
    (id, position) => {
      setImages((prev) =>
        prev.map((img) => {
          if (img.id !== id) return img;
          const patch = typeof position === 'function' ? position(img.position) : position;
          return { ...img, position: { ...img.position, ...patch } };
        })
      );
    },
    [setImages]
  );

  const deleteImage: StoreShape['deleteImage'] = useCallback(
    (id) => {
      setImages((prev) => prev.filter((img) => img.id !== id));
    },
    [setImages]
  );

  const nextPlaceholder = useCallback(() => {
    const next = (placeholderIndex + 1) % PLACEHOLDERS.length;
    setPlaceholderIndex(next);
    return PLACEHOLDERS[next];
  }, [placeholderIndex, setPlaceholderIndex]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [entries]);

  const value: StoreShape = {
    entries,
    quotes,
    books,
    images,
    featuredLog,
    placeholderIndex,
    addEntry,
    updateEntry,
    deleteEntry,
    addQuote,
    updateQuote,
    deleteQuote,
    featuredQuote,
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
    addImages,
    updateImagePosition,
    deleteImage,
    nextPlaceholder,
    allTags,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreShape {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

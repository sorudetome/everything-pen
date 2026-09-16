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
  addQuote: (text: string, source: string) => void;
  featuredQuote: Quote | null;

  currentBook: Book | null;
  finishedBooks: Book[];
  startBook: (title: string, author: string) => void;
  setBookRating: (bookId: string, rating: number) => void;
  addBookNote: (bookId: string, text: string) => void;
  finishBook: (bookId: string) => void;

  addImages: (dataUrls: string[]) => void;
  updateImagePosition: (id: string, position: ImageItem['position']) => void;

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

  const addQuote: StoreShape['addQuote'] = useCallback(
    (text, source) => {
      const quote: Quote = { id: uid(), text, source, keptAt: new Date().toISOString() };
      setQuotes((prev) => [quote, ...prev]);
    },
    [setQuotes]
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
        const additions: ImageItem[] = dataUrls.map((dataUrl, i) => ({
          id: uid(),
          dataUrl,
          uploadedAt: new Date().toISOString(),
          sortIndex: startIndex + i,
          position: {
            x: 20 + ((startIndex + i) * 37) % 200,
            y: 20 + ((startIndex + i) * 53) % 300,
            rotation: (((startIndex + i) * 17) % 20) - 10,
          },
        }));
        return [...additions, ...prev];
      });
    },
    [setImages]
  );

  const updateImagePosition: StoreShape['updateImagePosition'] = useCallback(
    (id, position) => {
      setImages((prev) => prev.map((img) => (img.id === id ? { ...img, position } : img)));
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
    addQuote,
    featuredQuote,
    currentBook,
    finishedBooks,
    startBook,
    setBookRating,
    addBookNote,
    finishBook,
    addImages,
    updateImagePosition,
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

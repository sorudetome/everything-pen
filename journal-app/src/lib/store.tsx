import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import type {
  Drawing,
  Entry,
  ImageFeatureLog,
  ImageItem,
  Mood,
  Quote,
  QuoteFeatureLog,
  StorageItem,
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

export const EXPORT_VERSION = 1;

export type Theme = 'dark' | 'light';

export interface ExportSnapshot {
  version: number;
  exportedAt: string;
  entries: Entry[];
  quotes: Quote[];
  storageItems: StorageItem[];
  images: ImageItem[];
  featuredLog: QuoteFeatureLog[];
  featuredImageLog: ImageFeatureLog[];
  placeholderIndex: number;
}

interface StoreShape {
  theme: Theme;
  toggleTheme: () => void;

  entries: Entry[];
  quotes: Quote[];
  storageItems: StorageItem[];
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

  addStorageItem: (content: string) => void;
  updateStorageItem: (id: string, content: string) => void;
  deleteStorageItem: (id: string) => void;

  addImages: (dataUrls: string[]) => void;
  updateImagePosition: (
    id: string,
    position: Partial<ImageItem['position']> | ((prev: ImageItem['position']) => Partial<ImageItem['position']>)
  ) => void;
  deleteImage: (id: string) => void;
  featuredImage: ImageItem | null;

  nextPlaceholder: () => string;
  allTags: string[];

  exportSnapshot: () => ExportSnapshot;
  importSnapshot: (data: ExportSnapshot) => void;
}

const StoreContext = createContext<StoreShape | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useLocalStorage<Theme>('journal.theme', 'dark');
  const [entries, setEntries] = useLocalStorage<Entry[]>('journal.entries', []);
  const [quotes, setQuotes] = useLocalStorage<Quote[]>('journal.quotes', []);
  const [storageItems, setStorageItems] = useLocalStorage<StorageItem[]>('journal.storageItems', []);
  const [images, setImages] = useLocalStorage<ImageItem[]>('journal.images', []);
  const [featuredLog, setFeaturedLog] = useLocalStorage<QuoteFeatureLog[]>('journal.featuredLog', []);
  const [featuredImageLog, setFeaturedImageLog] = useLocalStorage<ImageFeatureLog[]>('journal.featuredImageLog', []);
  const [placeholderIndex, setPlaceholderIndex] = useLocalStorage<number>('journal.placeholderIndex', -1);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#FDFCF6' : '#0A0A0A');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

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

  const addStorageItem: StoreShape['addStorageItem'] = useCallback(
    (content) => {
      const item: StorageItem = { id: uid(), content, addedAt: new Date().toISOString() };
      setStorageItems((prev) => [item, ...prev]);
    },
    [setStorageItems]
  );

  const updateStorageItem: StoreShape['updateStorageItem'] = useCallback(
    (id, content) => {
      setStorageItems((prev) => prev.map((s) => (s.id === id ? { ...s, content } : s)));
    },
    [setStorageItems]
  );

  const deleteStorageItem: StoreShape['deleteStorageItem'] = useCallback(
    (id) => {
      setStorageItems((prev) => prev.filter((s) => s.id !== id));
    },
    [setStorageItems]
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
      setFeaturedImageLog((prev) => prev.filter((f) => f.imageId !== id));
    },
    [setImages, setFeaturedImageLog]
  );

  useEffect(() => {
    if (images.length === 0) return;
    const today = todayISODate();
    if (featuredImageLog.some((f) => f.date === today)) return;
    const recentWindow = Math.max(0, featuredImageLog.length - Math.min(images.length - 1, 5));
    const recentlyUsed = new Set(featuredImageLog.slice(recentWindow).map((f) => f.imageId));
    let candidates = images.filter((img) => !recentlyUsed.has(img.id));
    if (candidates.length === 0) candidates = images;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    setFeaturedImageLog((prev) => [...prev.filter((f) => f.date !== today), { date: today, imageId: pick.id }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length, featuredImageLog.length]);

  const featuredImage = useMemo(() => {
    if (images.length === 0) return null;
    const today = todayISODate();
    const existing = featuredImageLog.find((f) => f.date === today);
    if (existing) {
      const img = images.find((img) => img.id === existing.imageId);
      if (img) return img;
    }
    return images[0];
  }, [images, featuredImageLog]);

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

  const exportSnapshot: StoreShape['exportSnapshot'] = useCallback(() => {
    return {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      entries,
      quotes,
      storageItems,
      images,
      featuredLog,
      featuredImageLog,
      placeholderIndex,
    };
  }, [entries, quotes, storageItems, images, featuredLog, featuredImageLog, placeholderIndex]);

  const importSnapshot: StoreShape['importSnapshot'] = useCallback(
    (data) => {
      setEntries(Array.isArray(data.entries) ? data.entries : []);
      setQuotes(Array.isArray(data.quotes) ? data.quotes : []);
      setStorageItems(Array.isArray(data.storageItems) ? data.storageItems : []);
      setImages(Array.isArray(data.images) ? data.images : []);
      setFeaturedLog(Array.isArray(data.featuredLog) ? data.featuredLog : []);
      setFeaturedImageLog(Array.isArray(data.featuredImageLog) ? data.featuredImageLog : []);
      setPlaceholderIndex(typeof data.placeholderIndex === 'number' ? data.placeholderIndex : -1);
    },
    [setEntries, setQuotes, setStorageItems, setImages, setFeaturedLog, setFeaturedImageLog, setPlaceholderIndex]
  );

  const value: StoreShape = {
    theme,
    toggleTheme,
    entries,
    quotes,
    storageItems,
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
    addStorageItem,
    updateStorageItem,
    deleteStorageItem,
    addImages,
    updateImagePosition,
    deleteImage,
    featuredImage,
    nextPlaceholder,
    allTags,
    exportSnapshot,
    importSnapshot,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreShape {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

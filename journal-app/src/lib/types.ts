export type Mood = 1 | 2 | 3 | 4 | 5;

export interface DrawingStroke {
  color: string;
  points: { x: number; y: number }[];
}

export interface Drawing {
  strokes: DrawingStroke[];
  dataUrl: string;
}

export interface Entry {
  id: string;
  date: string; // ISO timestamp
  bodyText: string;
  mood: Mood | null;
  tags: string[];
  drawing: Drawing | null;
}

export interface Quote {
  id: string;
  text: string;
  source: string;
  keptAt: string;
}

export interface StorageItem {
  id: string;
  content: string;
  addedAt: string;
}

export interface ImagePosition {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface ImageItem {
  id: string;
  dataUrl: string;
  uploadedAt: string;
  sortIndex: number;
  position: ImagePosition;
}

export interface QuoteFeatureLog {
  date: string; // yyyy-mm-dd
  quoteId: string;
}

export type ScreenId =
  | 'home'
  | 'words'
  | 'entries'
  | 'new'
  | 'storage'
  | 'insights'
  | 'images'
  | 'entryDetail';

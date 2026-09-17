import type { ExportSnapshot } from './store';
import { EXPORT_VERSION } from './store';
import { formatDateTime } from './storage';

export function isSnapshot(data: unknown): data is ExportSnapshot {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.entries) &&
    Array.isArray(d.quotes) &&
    Array.isArray(d.storageItems) &&
    Array.isArray(d.images)
  );
}

export function emptySnapshot(): ExportSnapshot {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    entries: [],
    quotes: [],
    storageItems: [],
    images: [],
    featuredLog: [],
    featuredImageLog: [],
    placeholderIndex: -1,
  };
}

export function readSnapshotFile(file: File): Promise<ExportSnapshot> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!isSnapshot(parsed)) {
          reject(new Error('not-a-snapshot'));
          return;
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('read-error'));
    reader.readAsText(file);
  });
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function snapshotFilename(ext: 'json' | 'txt'): string {
  return `journal-backup-${new Date().toISOString().slice(0, 10)}.${ext}`;
}

export function snapshotToText(snapshot: ExportSnapshot): string {
  const lines: string[] = [];
  lines.push('JOURNAL EXPORT');
  lines.push(`Exported: ${formatDateTime(snapshot.exportedAt)}`);
  lines.push('');

  lines.push('===== ENTRIES =====');
  lines.push('');
  if (snapshot.entries.length === 0) {
    lines.push('(none)');
  } else {
    for (const e of snapshot.entries) {
      const meta = [
        formatDateTime(e.date),
        e.mood ? `mood ${e.mood}/5` : 'mood: -',
        e.tags.length ? `tags: ${e.tags.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      lines.push(meta);
      lines.push(e.bodyText || '(no text)');
      lines.push('');
    }
  }

  lines.push('===== KEPT WORDS =====');
  lines.push('');
  if (snapshot.quotes.length === 0) {
    lines.push('(none)');
  } else {
    for (const q of snapshot.quotes) {
      lines.push(`"${q.text}"${q.source ? ` — ${q.source}` : ''}`);
      lines.push('');
    }
  }

  lines.push('===== STORAGE =====');
  lines.push('');
  if (snapshot.storageItems.length === 0) {
    lines.push('(none)');
  } else {
    for (const s of snapshot.storageItems) {
      lines.push(formatDateTime(s.addedAt));
      lines.push(s.content);
      lines.push('');
    }
  }

  lines.push(`(${snapshot.images.length} image${snapshot.images.length === 1 ? '' : 's'} not included — text export only. Use "Export data as JSON" for a full restorable backup.)`);

  return lines.join('\n');
}

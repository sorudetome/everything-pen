import React, { useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { SegmentedToggle } from '../components/SegmentedToggle';
import type { ImageItem } from '../lib/types';

const TILE_BASE = 110;
const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;
const DRAG_THRESHOLD = 6;

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function GridTile({
  image,
  editMode,
  onDelete,
}: {
  image: ImageItem;
  editMode: boolean;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="image-grid-tile">
      <img src={image.dataUrl} alt="" />
      {editMode &&
        (confirming ? (
          <div className="grid-tile-confirm">
            <span>Delete?</span>
            <div className="grid-tile-confirm-actions">
              <button className="text-btn danger" onClick={onDelete}>
                Yes
              </button>
              <button className="text-btn" onClick={() => setConfirming(false)}>
                No
              </button>
            </div>
          </div>
        ) : (
          <button className="grid-tile-delete" aria-label="Delete image" onClick={() => setConfirming(true)}>
            ✕
          </button>
        ))}
    </div>
  );
}

type Point = { x: number; y: number };

type Gesture =
  | { mode: 'none' }
  | { mode: 'drag'; startClient: Point; startPos: Point }
  | {
      mode: 'pinch';
      startDist: number;
      startAngle: number;
      startScale: number;
      startRotation: number;
      startMid: Point;
      startPos: Point;
    };

function FreeformTile({
  image,
  selected,
  onSelect,
  onDrag,
  onAdjust,
  onDelete,
}: {
  image: ImageItem;
  selected: boolean;
  onSelect: (id: string | null) => void;
  onDrag: (id: string, position: Partial<ImageItem['position']>) => void;
  onAdjust: (
    id: string,
    updater: (prev: ImageItem['position']) => Partial<ImageItem['position']>
  ) => void;
  onDelete: (id: string) => void;
}) {
  const pointersRef = useRef(new Map<number, Point>());
  const gestureRef = useRef<Gesture>({ mode: 'none' });
  const movedRef = useRef(0);
  const size = TILE_BASE * image.position.scale;

  function recomputeGesture() {
    const pts = [...pointersRef.current.values()];
    if (pts.length === 1) {
      gestureRef.current = {
        mode: 'drag',
        startClient: pts[0],
        startPos: { x: image.position.x, y: image.position.y },
      };
    } else if (pts.length >= 2) {
      const [a, b] = pts;
      gestureRef.current = {
        mode: 'pinch',
        startDist: Math.hypot(b.x - a.x, b.y - a.y) || 1,
        startAngle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
        startScale: image.position.scale,
        startRotation: image.position.rotation,
        startMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        startPos: { x: image.position.x, y: image.position.y },
      };
    } else {
      gestureRef.current = { mode: 'none' };
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // pointer capture isn't always available (e.g. certain synthetic/test inputs); gestures still work without it
    }
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movedRef.current = 0;
    recomputeGesture();
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gestureRef.current;

    if (g.mode === 'drag') {
      const p = [...pointersRef.current.values()][0];
      const dx = p.x - g.startClient.x;
      const dy = p.y - g.startClient.y;
      movedRef.current = Math.max(movedRef.current, Math.abs(dx), Math.abs(dy));
      onDrag(image.id, { x: g.startPos.x + dx, y: g.startPos.y + dy });
    } else if (g.mode === 'pinch') {
      const pts = [...pointersRef.current.values()];
      if (pts.length < 2) return;
      const [a, b] = pts;
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const newScale = clamp(g.startScale * (dist / g.startDist), MIN_SCALE, MAX_SCALE);
      const newRotation = g.startRotation + (angle - g.startAngle);
      const dx = mid.x - g.startMid.x;
      const dy = mid.y - g.startMid.y;
      movedRef.current = DRAG_THRESHOLD; // a pinch is never a tap
      onAdjust(image.id, () => ({
        scale: newScale,
        rotation: newRotation,
        x: g.startPos.x + dx,
        y: g.startPos.y + dy,
      }));
    }
  }

  function endPointer(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    const wasDrag = gestureRef.current.mode === 'drag';
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size === 0) {
      if (wasDrag && movedRef.current < DRAG_THRESHOLD) {
        onSelect(selected ? null : image.id);
      }
      gestureRef.current = { mode: 'none' };
      movedRef.current = 0;
    } else {
      recomputeGesture();
    }
  }

  return (
    <div
      className={`freeform-tile${selected ? ' selected' : ''}`}
      style={{
        left: image.position.x,
        top: image.position.y,
        width: size,
        height: size,
        transform: `rotate(${image.position.rotation}deg)`,
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onPointerLeave={(e) => {
        if (pointersRef.current.has(e.pointerId)) endPointer(e);
      }}
    >
      <img src={image.dataUrl} alt="" draggable={false} />
      {selected && (
        <div className="freeform-toolbar" onPointerDown={(e) => e.stopPropagation()}>
          <button
            className="freeform-tool-btn"
            aria-label="Shrink"
            onClick={() => onAdjust(image.id, (prev) => ({ scale: Math.max(MIN_SCALE, prev.scale - 0.15) }))}
          >
            −
          </button>
          <button
            className="freeform-tool-btn"
            aria-label="Enlarge"
            onClick={() => onAdjust(image.id, (prev) => ({ scale: Math.min(MAX_SCALE, prev.scale + 0.15) }))}
          >
            +
          </button>
          <button
            className="freeform-tool-btn"
            aria-label="Rotate left"
            onClick={() => onAdjust(image.id, (prev) => ({ rotation: prev.rotation - 15 }))}
          >
            ⟲
          </button>
          <button
            className="freeform-tool-btn"
            aria-label="Rotate right"
            onClick={() => onAdjust(image.id, (prev) => ({ rotation: prev.rotation + 15 }))}
          >
            ⟳
          </button>
          <button className="freeform-tool-btn danger" aria-label="Delete" onClick={() => onDelete(image.id)}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export function Images() {
  const { images, addImages, updateImagePosition, deleteImage } = useStore();
  const [view, setView] = useState<'grid' | 'freeform'>('grid');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gridEditMode, setGridEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const urls = await Promise.all(Array.from(fileList).map(readAsDataURL));
    addImages(urls);
  }

  const boardHeight = useMemo(() => {
    const maxBottom = images.reduce((max, img) => {
      const bottom = img.position.y + TILE_BASE * img.position.scale;
      return Math.max(max, bottom);
    }, 0);
    return Math.max(500, maxBottom + 60);
  }, [images]);

  return (
    <div className="screen">
      <div className="screen-title-row">
        <h1 className="screen-title">Images</h1>
        <div className="images-header-actions">
          {view === 'grid' && images.length > 0 && (
            <button className="see-all" onClick={() => setGridEditMode((v) => !v)}>
              {gridEditMode ? 'Done' : 'Edit'}
            </button>
          )}
          <button className="icon-btn" onClick={() => fileInputRef.current?.click()} aria-label="Upload image">
            +
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <SegmentedToggle
        options={[
          { id: 'grid', label: 'Grid' },
          { id: 'freeform', label: 'Freeform' },
        ]}
        value={view}
        onChange={setView}
      />

      {images.length === 0 ? (
        <p className="empty-hint">No images yet. Tap + to upload.</p>
      ) : view === 'grid' ? (
        <div className="image-grid">
          {images
            .slice()
            .sort((a, b) => b.sortIndex - a.sortIndex)
            .map((img) => (
              <GridTile key={img.id} image={img} editMode={gridEditMode} onDelete={() => deleteImage(img.id)} />
            ))}
        </div>
      ) : (
        <div className="freeform-board" style={{ height: boardHeight }} onPointerDown={() => setSelectedId(null)}>
          {images.map((img) => (
            <FreeformTile
              key={img.id}
              image={img}
              selected={selectedId === img.id}
              onSelect={setSelectedId}
              onDrag={(id, pos) => updateImagePosition(id, pos)}
              onAdjust={(id, pos) => updateImagePosition(id, pos)}
              onDelete={(id) => {
                deleteImage(id);
                setSelectedId(null);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

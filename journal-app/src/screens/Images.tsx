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

function GridTile({ image, onDelete }: { image: ImageItem; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="image-grid-tile">
      <img src={image.dataUrl} alt="" />
      {confirming ? (
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
      )}
    </div>
  );
}

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
  onAdjust: (id: string, updater: (prev: ImageItem['position']) => Partial<ImageItem['position']>) => void;
  onDelete: (id: string) => void;
}) {
  const draggingRef = useRef(false);
  const movedRef = useRef(0);
  const originRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const size = TILE_BASE * image.position.scale;

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // pointer capture isn't always available (e.g. certain synthetic/test inputs); dragging still works without it
    }
    draggingRef.current = true;
    movedRef.current = 0;
    originRef.current = { x: image.position.x, y: image.position.y, startX: e.clientX, startY: e.clientY };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const dx = e.clientX - originRef.current.startX;
    const dy = e.clientY - originRef.current.startY;
    movedRef.current = Math.max(movedRef.current, Math.abs(dx), Math.abs(dy));
    onDrag(image.id, { x: originRef.current.x + dx, y: originRef.current.y + dy });
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    draggingRef.current = false;
    if (movedRef.current < DRAG_THRESHOLD) {
      onSelect(selected ? null : image.id);
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
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        draggingRef.current = false;
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
        <button className="icon-btn" onClick={() => fileInputRef.current?.click()} aria-label="Upload image">
          +
        </button>
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
              <GridTile key={img.id} image={img} onDelete={() => deleteImage(img.id)} />
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

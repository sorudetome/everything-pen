import React, { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { SegmentedToggle } from '../components/SegmentedToggle';
import type { ImageItem } from '../lib/types';

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function FreeformTile({
  image,
  onDrag,
}: {
  image: ImageItem;
  onDrag: (id: string, position: ImageItem['position']) => void;
}) {
  const draggingRef = useRef(false);
  const originRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    originRef.current = { x: image.position.x, y: image.position.y, startX: e.clientX, startY: e.clientY };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const dx = e.clientX - originRef.current.startX;
    const dy = e.clientY - originRef.current.startY;
    onDrag(image.id, { ...image.position, x: originRef.current.x + dx, y: originRef.current.y + dy });
  }

  function handlePointerUp() {
    draggingRef.current = false;
  }

  return (
    <div
      className="freeform-tile"
      style={{
        left: image.position.x,
        top: image.position.y,
        transform: `rotate(${image.position.rotation}deg)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <img src={image.dataUrl} alt="" draggable={false} />
    </div>
  );
}

export function Images() {
  const { images, addImages, updateImagePosition } = useStore();
  const [view, setView] = useState<'grid' | 'freeform'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const urls = await Promise.all(Array.from(fileList).map(readAsDataURL));
    addImages(urls);
  }

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
              <div key={img.id} className="image-grid-tile">
                <img src={img.dataUrl} alt="" />
              </div>
            ))}
        </div>
      ) : (
        <div className="freeform-board">
          {images.map((img) => (
            <FreeformTile key={img.id} image={img} onDrag={updateImagePosition} />
          ))}
        </div>
      )}
    </div>
  );
}

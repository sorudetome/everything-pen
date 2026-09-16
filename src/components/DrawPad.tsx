import React, { useEffect, useRef, useState } from 'react';
import type { DrawingStroke } from '../lib/types';

const INK_COLORS = ['#EDEDEC', '#9AA7B5', '#8B94A0', '#4A5058', '#D9534F'];

export function DrawPad({
  strokes,
  onChange,
}: {
  strokes: DrawingStroke[];
  onChange: (strokes: DrawingStroke[], dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(INK_COLORS[0]);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);
  const strokesRef = useRef<DrawingStroke[]>(strokes);

  useEffect(() => {
    strokesRef.current = strokes;
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1D1D1E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokesRef.current) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (const p of stroke.points.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }

  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    currentStrokeRef.current = { color, points: [pointFromEvent(e)] };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || !currentStrokeRef.current) return;
    currentStrokeRef.current.points.push(pointFromEvent(e));
    strokesRef.current = [...strokes, currentStrokeRef.current];
    redraw();
  }

  function commit() {
    if (!drawingRef.current || !currentStrokeRef.current) return;
    drawingRef.current = false;
    const next = [...strokes, currentStrokeRef.current];
    currentStrokeRef.current = null;
    const canvas = canvasRef.current;
    onChange(next, canvas ? canvas.toDataURL('image/png') : '');
  }

  function clear() {
    onChange([], '');
  }

  return (
    <div className="draw-pad">
      <canvas
        ref={canvasRef}
        width={310}
        height={280}
        className="draw-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={commit}
        onPointerLeave={commit}
      />
      <div className="draw-controls">
        <div className="ink-swatches">
          {INK_COLORS.map((c) => (
            <button
              key={c}
              className={`ink-swatch${color === c ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Ink ${c}`}
            />
          ))}
        </div>
        <button className="text-btn" onClick={clear}>
          Clear
        </button>
      </div>
      <p className="hint-caption">Drawing saves with this entry.</p>
    </div>
  );
}

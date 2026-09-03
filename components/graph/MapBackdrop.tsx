'use client';

import React, { useRef } from 'react';
import { useViewport } from '@xyflow/react';

interface MapBackdropProps {
  mapUrl: string;
  opacity: number; // 0–1
  scale?: number;  // 0.3–3.0
  position?: { x: number; y: number };
  isFixed?: boolean;
  isAdjusting?: boolean;
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

/**
 * Renders the world map image as an independent background layer.
 *
 * Architecture:
 * - The map image sits at zIndex:0 with pointer-events:none so it NEVER blocks nodes.
 * - When isAdjusting=true, a fullscreen transparent overlay is rendered at zIndex:10.
 *   This overlay intercepts all pointer events and calls stopPropagation() so React Flow
 *   cannot also pan the graph. The map position is updated via onPositionChange callbacks.
 */
export function MapBackdrop({
  mapUrl,
  opacity,
  scale = 1,
  position = { x: 0, y: 0 },
  isFixed = true,
  isAdjusting = false,
  onPositionChange,
}: MapBackdropProps) {
  const { x, y, zoom } = useViewport();
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startOffsetRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startOffsetRef.current = { ...position };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    if (!onPositionChange) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    onPositionChange({
      x: Math.round(startOffsetRef.current.x + dx),
      y: Math.round(startOffsetRef.current.y + dy),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  };

  // Fixed mode (default): map stays visually centered on screen, independent of graph pan/zoom
  // Canvas mode: map moves with graph pan/zoom (anchored to canvas coordinates)
  const transform = isFixed
    ? `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`
    : `translate(${x + position.x}px, ${y + position.y}px) scale(${zoom * scale})`;

  const transformOrigin = isFixed ? 'center center' : '0 0';

  return (
    <>
      {/* ── Map image layer ──────────────────────────────────────────────── */}
      {/* Always behind nodes. pointer-events: none so it NEVER blocks interaction. */}
      <div
        className="absolute inset-0 overflow-hidden select-none pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden
      >
        <div
          style={{
            position: 'absolute',
            top: isFixed ? '50%' : 0,
            left: isFixed ? '50%' : 0,
            transformOrigin,
            transform,
            width: '1280px',
            height: '800px',
            opacity,
            pointerEvents: 'none',
            transition: 'opacity 0.2s ease',
          }}
          className={isAdjusting ? 'ring-2 ring-[#8A4938] ring-dashed rounded-lg' : ''}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mapUrl}
            alt="World map backdrop"
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              userSelect: 'none',
              display: 'block',
            }}
          />
        </div>
      </div>

      {/* ── Reposition overlay ───────────────────────────────────────────── */}
      {/* Rendered ONLY in adjust mode. Covers the whole canvas at zIndex:10.
          All pointer events are captured and stopped here so React Flow cannot
          also pan the graph while the user drags. */}
      {isAdjusting && (
        <div
          className="absolute inset-0 select-none"
          style={{ zIndex: 10, cursor: isDraggingRef.current ? 'grabbing' : 'grab', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-hidden
        >
          {/* Instruction banner */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[11px] font-mono px-4 py-1.5 rounded-full shadow-lg pointer-events-none flex items-center gap-2">
            <span>✥</span>
            <span>Drag anywhere to reposition map — click <strong>Lock Map Position</strong> when done</span>
          </div>
        </div>
      )}
    </>
  );
}

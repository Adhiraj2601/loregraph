'use client';

import React, { useRef } from 'react';
import { useViewport } from '@xyflow/react';

interface MapBackdropProps {
  mapUrl: string;
  opacity: number; // 0–1
  scale?: number; // 0.3–3.0
  position?: { x: number; y: number };
  isFixed?: boolean;
  isAdjusting?: boolean;
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

/**
 * Renders the world map image as an independent background layer.
 * Stays strictly beneath all nodes (zIndex: 0) and does not cover or block node interaction.
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

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isAdjusting) return;
    isDraggingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startOffsetRef.current = { ...position };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !onPositionChange) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    onPositionChange({
      x: Math.round(startOffsetRef.current.x + dx),
      y: Math.round(startOffsetRef.current.y + dy),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Compute transform
  // Fixed mode (default): centered relative to viewport, independent of graph pan/zoom
  // Canvas mode: anchored to graph canvas coordinates
  const transform = isFixed
    ? `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`
    : `translate(${x + position.x}px, ${y + position.y}px) scale(${zoom * scale})`;

  const transformOrigin = isFixed ? 'center center' : '0 0';

  return (
    <div
      className="absolute inset-0 overflow-hidden select-none pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: 'absolute',
          top: isFixed ? '50%' : 0,
          left: isFixed ? '50%' : 0,
          transformOrigin,
          transform,
          width: '1280px',
          height: '800px',
          opacity,
          pointerEvents: isAdjusting ? 'auto' : 'none',
          cursor: isAdjusting ? 'grab' : 'default',
          transition: isDraggingRef.current ? 'none' : 'opacity 0.2s ease, transform 0.1s ease-out',
        }}
        className={isAdjusting ? 'ring-2 ring-[#8A4938] ring-dashed rounded-lg' : ''}
      >
        {isAdjusting && (
          <div className="absolute top-2 left-2 z-10 bg-black/75 text-white text-[11px] font-mono px-2.5 py-1 rounded shadow-md pointer-events-none">
            ✥ Drag map to position
          </div>
        )}
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
  );
}

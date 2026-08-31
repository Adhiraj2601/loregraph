'use client';

import React from 'react';
import { useViewport } from '@xyflow/react';

interface MapBackdropProps {
  mapUrl: string;
  opacity: number; // 0–1
}

/**
 * Renders the world map image locked to the React Flow viewport transform.
 * Must be a child of a <ReactFlow> component so useViewport() works.
 */
export function MapBackdrop({ mapUrl, opacity }: MapBackdropProps) {
  const { x, y, zoom } = useViewport();

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transformOrigin: '0 0',
          transform: `translate(${x}px, ${y}px) scale(${zoom})`,
          // Size at 1× zoom: covers exactly the initial viewport so the map
          // feels natural — 100vw × 100vh in flow units (before scaling).
          width: '100vw',
          height: '100vh',
          opacity,
          transition: 'opacity 0.2s ease',
        }}
      >
        <img
          src={mapUrl}
          alt="World map backdrop"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            userSelect: 'none',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
}

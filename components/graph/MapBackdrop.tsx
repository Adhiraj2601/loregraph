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
  // Atmospheric / Ambient wallpaper features (vvd.world style)
  backdropMode?: 'map' | 'ambient';
  blur?: number; // 0–30px
  pixelate?: boolean;
  dimming?: number; // 0–80%
  fitMode?: 'contain' | 'cover';
}

/**
 * Renders the world map or atmospheric scenic backdrop as an independent background layer.
 *
 * Supports two distinct modes:
 * 1. 'map': Sharp, high-clarity geography map with custom position, scale, and coordinate tracking.
 * 2. 'ambient': Dreamy, atmospheric wallpaper (vvd.world style) with gaussian blur, pixelated mosaic effect,
 *    subtle vignette, and dimming for rich fantasy environments.
 */
export function MapBackdrop({
  mapUrl,
  opacity,
  scale = 1,
  position = { x: 0, y: 0 },
  isFixed = true,
  isAdjusting = false,
  onPositionChange,
  backdropMode = 'map',
  blur = 16,
  pixelate = false,
  dimming = 25,
  fitMode = 'cover',
}: MapBackdropProps) {
  const { x, y, zoom } = useViewport();
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startOffsetRef = useRef({ x: 0, y: 0 });

  const isAmbient = backdropMode === 'ambient';

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

  // Fixed mode (default): backdrop stays visually centered on screen, independent of graph pan/zoom
  // Canvas mode: backdrop moves with graph pan/zoom (anchored to canvas coordinates)
  const transform = isFixed
    ? `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`
    : `translate(${x + position.x}px, ${y + position.y}px) scale(${zoom * scale})`;

  const transformOrigin = isFixed ? 'center center' : '0 0';

  // Compute CSS filter for atmospheric effect
  const calculatedBrightness = 1 - (dimming / 100) * 0.45;
  const filterStyle = isAmbient
    ? `blur(${blur}px) brightness(${calculatedBrightness}) contrast(${pixelate ? 1.25 : 1.05}) saturate(1.1)`
    : undefined;

  return (
    <>
      {/* ── Background layer (Always behind nodes; pointer-events: none) ── */}
      <div
        className="absolute inset-0 overflow-hidden select-none pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden
      >
        {isAmbient && fitMode === 'cover' ? (
          /* Fullscreen Ambient Cover Mode */
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              opacity,
              transition: 'opacity 0.2s ease',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mapUrl}
              alt="Atmospheric world backdrop"
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: filterStyle,
                imageRendering: pixelate ? 'pixelated' : 'auto',
                transform: `scale(${1 + (blur > 0 ? 0.08 : 0)})`, // slight scale to prevent white edges during blur
                userSelect: 'none',
                display: 'block',
              }}
            />

            {/* Optional Retro Pixel / Dither Texture Grid Overlay */}
            {pixelate && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(rgba(0, 0, 0, 0.25) 1px, transparent 0)`,
                  backgroundSize: '4px 4px',
                  mixBlendMode: 'multiply',
                  opacity: 0.6,
                }}
              />
            )}

            {/* Atmospheric Vignette & Depth Mask */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, ${(dimming / 100) * 0.5 + 0.15}) 100%)`,
              }}
            />
          </div>
        ) : (
          /* Standard Anchored / Resizable Frame Mode (for Maps and framed Backdrops) */
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
              alt="World backdrop"
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: fitMode === 'cover' ? 'cover' : 'contain',
                filter: filterStyle,
                imageRendering: pixelate ? 'pixelated' : 'auto',
                userSelect: 'none',
                display: 'block',
              }}
            />

            {isAmbient && pixelate && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(rgba(0, 0, 0, 0.25) 1px, transparent 0)`,
                  backgroundSize: '4px 4px',
                  mixBlendMode: 'multiply',
                  opacity: 0.6,
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Reposition overlay (Rendered ONLY when actively repositioning) ── */}
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
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/85 text-white text-[11px] font-mono px-4 py-1.5 rounded-full shadow-xl pointer-events-none flex items-center gap-2">
            <span>✥</span>
            <span>Drag anywhere to reposition backdrop — click <strong>Lock Position</strong> when done</span>
          </div>
        </div>
      )}
    </>
  );
}

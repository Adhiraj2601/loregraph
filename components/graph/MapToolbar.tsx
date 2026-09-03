'use client';

import React, { useRef, useState } from 'react';
import { Map, X, SlidersHorizontal, ZoomIn, ZoomOut, Move, RotateCcw, Check, Pin } from 'lucide-react';

interface MapToolbarProps {
  mapUrl: string | null;
  opacity: number; // 0–1
  scale: number; // 0.3–3.0
  isFixed: boolean;
  isAdjusting: boolean;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onOpacityChange: (opacity: number) => void;
  onScaleChange: (scale: number) => void;
  onToggleFixed: () => void;
  onToggleAdjusting: () => void;
  onReset: () => void;
  onRemove: () => void;
}

export function MapToolbar({
  mapUrl,
  opacity,
  scale,
  isFixed,
  isAdjusting,
  isUploading,
  onUpload,
  onOpacityChange,
  onScaleChange,
  onToggleFixed,
  onToggleAdjusting,
  onReset,
  onRemove,
}: MapToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showControls, setShowControls] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  const handleContract = () => {
    onScaleChange(Math.max(0.3, Math.round((scale - 0.15) * 100) / 100));
  };

  const handleExpand = () => {
    onScaleChange(Math.min(3.0, Math.round((scale + 0.15) * 100) / 100));
  };

  return (
    <div
      className="absolute bottom-16 right-5 z-20 flex flex-col items-end gap-2"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/svg+xml, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Map Control Panel Popover */}
      {mapUrl && showControls && (
        <div
          className="w-72 p-3.5 rounded-lg shadow-xl space-y-3.5 animate-editorial-fade"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-light)' }}>
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold" style={{ color: 'var(--text-primary)' }}>
              World Map Controls
            </span>
            <button
              onClick={onReset}
              className="text-[10px] font-mono text-gray-500 hover:text-black flex items-center gap-1 hover:underline"
              title="Reset size and position"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          </div>

          {/* Size / Scale (Expand & Contract) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Size (Expand / Contract)
              </span>
              <span className="text-[10px] font-mono font-medium" style={{ color: 'var(--accent-rust)' }}>
                {Math.round(scale * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleContract}
                className="p-1 rounded hover:bg-[#ECE8DF] text-gray-600 transition-colors"
                title="Contract map (-15%)"
              >
                <ZoomOut size={13} />
              </button>
              <input
                type="range"
                min={30}
                max={300}
                step={5}
                value={Math.round(scale * 100)}
                onChange={e => onScaleChange(Number(e.target.value) / 100)}
                className="flex-1 accent-[#8A4938] h-1.5"
              />
              <button
                onClick={handleExpand}
                className="p-1 rounded hover:bg-[#ECE8DF] text-gray-600 transition-colors"
                title="Expand map (+15%)"
              >
                <ZoomIn size={13} />
              </button>
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Opacity
              </span>
              <span className="text-[10px] font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
                {Math.round(opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={100}
              step={5}
              value={Math.round(opacity * 100)}
              onChange={e => onOpacityChange(Number(e.target.value) / 100)}
              className="w-full accent-[#8A4938] h-1.5"
            />
          </div>

          {/* Mode & Repositioning Buttons */}
          <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--border-light)' }}>
            {/* Fixed Background Mode Toggle */}
            <button
              onClick={onToggleFixed}
              className="w-full py-1.5 px-2.5 rounded text-xs font-mono flex items-center justify-between border transition-all"
              style={{
                borderColor: isFixed ? 'var(--accent-rust)' : 'var(--border)',
                background: isFixed ? 'rgba(138, 73, 56, 0.08)' : 'transparent',
                color: isFixed ? 'var(--accent-rust)' : 'var(--text-secondary)',
              }}
            >
              <span className="flex items-center gap-1.5">
                <Pin size={11} />
                <span>{isFixed ? 'Fixed Background' : 'Move with Graph'}</span>
              </span>
              <span className="text-[9px] opacity-75">
                {isFixed ? 'Nodes free' : 'Pan locked'}
              </span>
            </button>

            {/* Reposition Drag Mode Toggle */}
            <button
              onClick={onToggleAdjusting}
              className="w-full py-1.5 px-2.5 rounded text-xs font-mono flex items-center justify-center gap-1.5 border transition-all"
              style={{
                borderColor: isAdjusting ? 'var(--accent-rust)' : 'var(--border)',
                background: isAdjusting ? 'var(--accent-rust)' : '#ECE8DF',
                color: isAdjusting ? '#FCFAF7' : 'var(--text-primary)',
              }}
            >
              {isAdjusting ? (
                <>
                  <Check size={12} />
                  <span>Lock Map Position</span>
                </>
              ) : (
                <>
                  <Move size={12} />
                  <span>Reposition Map (Drag)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main toolbar pill */}
      <div
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg shadow-md"
        style={{
          background: 'var(--surface)',
          border: `1px solid ${mapUrl ? 'var(--accent-rust)' : 'var(--border)'}`,
        }}
      >
        {mapUrl ? (
          <>
            {/* Replace map button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-[#ECE8DF]"
              style={{ color: 'var(--accent-rust)' }}
              title="Replace world map"
            >
              <Map size={13} />
              <span className="hidden sm:inline">
                {isUploading ? 'Uploading…' : 'Change Map'}
              </span>
            </button>

            {/* Controls toggle */}
            <button
              onClick={() => setShowControls(v => !v)}
              className="p-1.5 rounded transition-colors hover:bg-[#ECE8DF] flex items-center gap-1"
              style={{ color: showControls ? 'var(--accent-rust)' : 'var(--text-secondary)' }}
              title="Expand/Contract, Opacity, and Settings"
            >
              <SlidersHorizontal size={13} />
              <span className="text-[10px] font-mono hidden sm:inline">
                {Math.round(scale * 100)}%
              </span>
            </button>

            {/* Remove map */}
            <button
              onClick={onRemove}
              className="p-1.5 rounded transition-colors hover:bg-red-50 text-[#9B3D3D]"
              title="Remove world map"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-[#ECE8DF]"
            style={{ color: 'var(--text-secondary)' }}
            title="Upload a world map image"
          >
            <Map size={13} />
            <span>{isUploading ? 'Uploading…' : 'Set World Map'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

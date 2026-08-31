'use client';

import React, { useRef, useState } from 'react';
import { Map, X, SlidersHorizontal } from 'lucide-react';

interface MapToolbarProps {
  mapUrl: string | null;
  opacity: number; // 0–1
  isUploading: boolean;
  onUpload: (file: File) => void;
  onOpacityChange: (opacity: number) => void;
  onRemove: () => void;
}

export function MapToolbar({
  mapUrl,
  opacity,
  isUploading,
  onUpload,
  onOpacityChange,
  onRemove,
}: MapToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showOpacity, setShowOpacity] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    // Reset so the same file can be re-uploaded if needed
    e.target.value = '';
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

      {/* Opacity slider — shown when map is loaded */}
      {mapUrl && showOpacity && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-md"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            Opacity
          </span>
          <input
            type="range"
            min={20}
            max={100}
            step={5}
            value={Math.round(opacity * 100)}
            onChange={e => onOpacityChange(Number(e.target.value) / 100)}
            className="w-28 accent-[#8A4938]"
          />
          <span className="text-[10px] font-mono w-7 text-right" style={{ color: 'var(--text-secondary)' }}>
            {Math.round(opacity * 100)}%
          </span>
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

            {/* Opacity toggle */}
            <button
              onClick={() => setShowOpacity(v => !v)}
              className="p-1.5 rounded transition-colors hover:bg-[#ECE8DF]"
              style={{ color: showOpacity ? 'var(--accent-rust)' : 'var(--text-secondary)' }}
              title="Adjust map opacity"
            >
              <SlidersHorizontal size={13} />
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

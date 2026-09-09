'use client';

import React, { useRef, useState } from 'react';
import {
  Map,
  X,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Check,
  Pin,
  Sparkles,
  Grid,
  Moon,
  Maximize2,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { DEFAULT_BACKGROUNDS, DefaultBackground } from '@/lib/defaultBackgrounds';

interface MapToolbarProps {
  mapUrl: string | null;
  opacity: number; // 0–1
  scale: number; // 0.3–3.0
  isFixed: boolean;
  isAdjusting: boolean;
  isUploading: boolean;
  backdropMode?: 'map' | 'ambient';
  blur?: number;
  pixelate?: boolean;
  dimming?: number;
  fitMode?: 'contain' | 'cover';
  onUpload: (file: File) => void;
  onSelectPreset?: (preset: DefaultBackground) => void;
  onOpacityChange: (opacity: number) => void;
  onScaleChange: (scale: number) => void;
  onToggleFixed: () => void;
  onToggleAdjusting: () => void;
  onBackdropModeChange?: (mode: 'map' | 'ambient') => void;
  onBlurChange?: (blur: number) => void;
  onTogglePixelate?: () => void;
  onDimmingChange?: (dimming: number) => void;
  onToggleFitMode?: () => void;
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
  backdropMode = 'map',
  blur = 16,
  pixelate = false,
  dimming = 25,
  fitMode = 'cover',
  onUpload,
  onSelectPreset,
  onOpacityChange,
  onScaleChange,
  onToggleFixed,
  onToggleAdjusting,
  onBackdropModeChange,
  onBlurChange,
  onTogglePixelate,
  onDimmingChange,
  onToggleFitMode,
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

  const isAmbient = backdropMode === 'ambient';

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

      {/* Backdrop Control Panel Popover */}
      {showControls && (
        <div
          className="w-84 p-4 rounded-xl shadow-2xl space-y-3.5 animate-editorial-fade max-h-[85vh] overflow-y-auto"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            width: '340px',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--border-light)' }}>
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#8A4938]" />
              <span className="text-xs font-mono uppercase tracking-wider font-semibold" style={{ color: 'var(--text-primary)' }}>
                World Backdrop
              </span>
            </div>
            <div className="flex items-center gap-2">
              {mapUrl && (
                <button
                  onClick={onReset}
                  className="text-[10px] font-mono text-gray-500 hover:text-black flex items-center gap-1 hover:underline"
                  title="Reset backdrop settings"
                >
                  <RotateCcw size={10} />
                  <span>Reset</span>
                </button>
              )}
              <button
                onClick={() => setShowControls(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* ── PRESET BACKGROUND GALLERY (4 Pre-loaded Backgrounds) ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
                Pre-Loaded Wallpapers
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-[10px] font-mono text-[#8A4938] hover:underline flex items-center gap-1"
              >
                <Upload size={10} />
                <span>Upload Custom</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_BACKGROUNDS.map(preset => {
                const isActive = mapUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectPreset?.(preset)}
                    className={`group relative rounded-lg overflow-hidden border text-left transition-all p-1 flex flex-col gap-1.5 ${
                      isActive
                        ? 'border-[#8A4938] bg-[#8A4938]/10 ring-2 ring-[#8A4938]/30 shadow-sm'
                        : 'border-gray-200 hover:border-[#8A4938]/60 bg-[#FAF8F4]'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-full h-16 rounded overflow-hidden relative bg-black/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preset.url}
                        alt={preset.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      {isActive && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#8A4938] text-white flex items-center justify-center shadow">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                      <span className="absolute bottom-1 left-1 text-[8px] font-mono bg-black/60 text-white px-1 py-0.2 rounded backdrop-blur-sm">
                        {preset.category}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="px-0.5 pb-0.5">
                      <div className="text-[11px] font-serif font-medium truncate text-gray-800">
                        {preset.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── BACKDROP CONTROLS (Rendered when a backdrop is active) ── */}
          {mapUrl && (
            <>
              {/* Mode Switcher: Clear Map vs Ambient Scene */}
              <div className="flex items-center p-0.5 rounded-md bg-[#ECE8DF] text-xs font-mono">
                <button
                  onClick={() => onBackdropModeChange?.('map')}
                  className={`flex-1 py-1 px-2 rounded flex items-center justify-center gap-1.5 transition-all ${
                    !isAmbient
                      ? 'bg-white text-[#8A4938] font-medium shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  <Map size={12} />
                  <span>Clear Map</span>
                </button>
                <button
                  onClick={() => onBackdropModeChange?.('ambient')}
                  className={`flex-1 py-1 px-2 rounded flex items-center justify-center gap-1.5 transition-all ${
                    isAmbient
                      ? 'bg-white text-[#8A4938] font-medium shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  <Sparkles size={12} />
                  <span>Ambient Scene</span>
                </button>
              </div>

              {/* ── AMBIENT SCENE CONTROLS (vvd.world style) ── */}
              {isAmbient ? (
                <div className="space-y-3 pt-0.5">
                  {/* Blur Level Slider + Preset Chips */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Blur Intensity
                      </span>
                      <span className="text-[10px] font-mono font-medium" style={{ color: 'var(--accent-rust)' }}>
                        {blur}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      step={1}
                      value={blur}
                      onChange={e => onBlurChange?.(Number(e.target.value))}
                      className="w-full accent-[#8A4938] h-1.5"
                    />
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {[
                        { label: 'Crisp', val: 0 },
                        { label: 'Subtle', val: 6 },
                        { label: 'Atmospheric', val: 14 },
                        { label: 'Deep Dream', val: 24 },
                      ].map(preset => (
                        <button
                          key={preset.label}
                          onClick={() => onBlurChange?.(preset.val)}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                            blur === preset.val
                              ? 'border-[#8A4938] bg-[#8A4938]/10 text-[#8A4938] font-semibold'
                              : 'border-gray-200 text-gray-500 hover:border-gray-400'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pixelated / Retro Mosaic Effect Toggle */}
                  <div className="flex items-center justify-between py-1 border-t border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <div className="flex items-center gap-1.5">
                      <Grid size={13} className="text-gray-600" />
                      <div>
                        <div className="text-[11px] font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                          Pixelated / Mosaic Texture
                        </div>
                        <div className="text-[9px] text-gray-500">
                          Retro grain & pixel-dither styling
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onTogglePixelate?.()}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                        pixelate ? 'bg-[#8A4938]' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          pixelate ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Dimming / Darkness Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        <Moon size={10} />
                        <span>Atmospheric Dimming</span>
                      </span>
                      <span className="text-[10px] font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {dimming}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={70}
                      step={5}
                      value={dimming}
                      onChange={e => onDimmingChange?.(Number(e.target.value))}
                      className="w-full accent-[#8A4938] h-1.5"
                    />
                  </div>

                  {/* Fit Mode Toggle */}
                  <button
                    onClick={() => onToggleFitMode?.()}
                    className="w-full py-1.5 px-2.5 rounded text-xs font-mono flex items-center justify-between border transition-all"
                    style={{
                      borderColor: fitMode === 'cover' ? 'var(--accent-rust)' : 'var(--border)',
                      background: fitMode === 'cover' ? 'rgba(138, 73, 56, 0.08)' : 'transparent',
                      color: fitMode === 'cover' ? 'var(--accent-rust)' : 'var(--text-secondary)',
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      <Maximize2 size={11} />
                      <span>{fitMode === 'cover' ? 'Fullscreen Ambient Cover' : 'Contained Wallpaper Frame'}</span>
                    </span>
                    <span className="text-[9px] opacity-75">
                      {fitMode === 'cover' ? 'Full Bleed' : 'Framed'}
                    </span>
                  </button>
                </div>
              ) : (
                /* ── CLEAR MAP CONTROLS ── */
                <div className="space-y-3 pt-0.5">
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
              )}

              {/* Opacity Slider */}
              <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Backdrop Opacity
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

              {/* Remove backdrop button */}
              <div className="pt-2 border-t flex justify-end" style={{ borderColor: 'var(--border-light)' }}>
                <button
                  onClick={onRemove}
                  className="text-xs font-mono text-[#9B3D3D] hover:underline flex items-center gap-1 py-1"
                >
                  <X size={12} />
                  <span>Remove Backdrop</span>
                </button>
              </div>
            </>
          )}
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
            {/* Gallery / Controls toggle */}
            <button
              onClick={() => setShowControls(v => !v)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-[#ECE8DF]"
              style={{ color: 'var(--accent-rust)' }}
              title="Change backdrop or adjust blur, pixelate, and styling"
            >
              {isAmbient ? <Sparkles size={13} /> : <Map size={13} />}
              <span className="hidden sm:inline">
                {isAmbient ? 'Backdrop Scene' : 'World Map'}
              </span>
            </button>

            {/* Quick settings icon */}
            <button
              onClick={() => setShowControls(v => !v)}
              className="p-1.5 rounded transition-colors hover:bg-[#ECE8DF] flex items-center gap-1"
              style={{ color: showControls ? 'var(--accent-rust)' : 'var(--text-secondary)' }}
              title="Backdrop Gallery & Settings"
            >
              <SlidersHorizontal size={13} />
              <span className="text-[10px] font-mono hidden sm:inline">
                {isAmbient ? `${blur}px` : `${Math.round(scale * 100)}%`}
              </span>
            </button>

            {/* Remove backdrop */}
            <button
              onClick={onRemove}
              className="p-1.5 rounded transition-colors hover:bg-red-50 text-[#9B3D3D]"
              title="Remove backdrop"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowControls(v => !v)}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-[#ECE8DF]"
            style={{ color: 'var(--text-secondary)' }}
            title="Choose a pre-loaded backdrop or upload your own map"
          >
            <Sparkles size={13} />
            <span>{isUploading ? 'Uploading…' : 'Set Background / Map'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

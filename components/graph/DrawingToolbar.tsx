'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  PenTool,
  Highlighter,
  Eraser,
  MousePointer,
  RotateCcw,
  Trash2,
  Minus,
} from 'lucide-react';
import { DrawingTool } from '@/types/drawing';

interface DrawingToolbarProps {
  isDrawingMode: boolean;
  onToggleDrawingMode: () => void;
  activeTool: DrawingTool;
  onSelectTool: (tool: DrawingTool) => void;
  activeColor: string;
  onSelectColor: (color: string) => void;
  activeSize: number;
  onSelectSize: (size: number) => void;
  onUndo: () => void;
  onClear: () => void;
  canUndo: boolean;
}

const PALETTE = [
  { name: 'Charcoal', color: '#171717' },
  { name: 'Rust', color: '#8A4938' },
  { name: 'Slate', color: '#596A72' },
  { name: 'Ochre', color: '#9E6B47' },
  { name: 'Sage', color: '#657560' },
  { name: 'Paper', color: '#FCFAF7' },
];

const SIZES = [
  { label: 'S', value: 3 },
  { label: 'M', value: 6 },
  { label: 'L', value: 12 },
];

export function DrawingToolbar({
  isDrawingMode,
  onToggleDrawingMode,
  activeTool,
  onSelectTool,
  activeColor,
  onSelectColor,
  activeSize,
  onSelectSize,
  onUndo,
  onClear,
  canUndo,
}: DrawingToolbarProps) {
  return (
    <motion.div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-full shadow-lg border backdrop-blur-md transition-all"
      style={{
        background: 'rgba(252, 250, 247, 0.94)',
        borderColor: 'var(--border)',
      }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Mode Toggle: Select vs Draw */}
      <button
        onClick={() => {
          if (isDrawingMode) onToggleDrawingMode();
        }}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          !isDrawingMode ? 'bg-[#ECE8DF] text-[#171717]' : 'text-[#73716B] hover:text-[#171717]'
        }`}
        title="Select & Navigate (V / Esc)"
      >
        <MousePointer size={14} />
      </button>

      <button
        onClick={() => {
          if (!isDrawingMode) onToggleDrawingMode();
          onSelectTool('pen');
        }}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isDrawingMode && activeTool === 'pen' ? 'bg-[#ECE8DF] text-[#8A4938]' : 'text-[#73716B] hover:text-[#171717]'
        }`}
        title="Ink Pen (D)"
      >
        <PenTool size={14} />
      </button>

      <button
        onClick={() => {
          if (!isDrawingMode) onToggleDrawingMode();
          onSelectTool('highlighter');
        }}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isDrawingMode && activeTool === 'highlighter' ? 'bg-[#ECE8DF] text-[#8A4938]' : 'text-[#73716B] hover:text-[#171717]'
        }`}
        title="Highlighter / Territory Wash (H)"
      >
        <Highlighter size={14} />
      </button>

      <button
        onClick={() => {
          if (!isDrawingMode) onToggleDrawingMode();
          onSelectTool('eraser');
        }}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isDrawingMode && activeTool === 'eraser' ? 'bg-[#ECE8DF] text-[#8A4938]' : 'text-[#73716B] hover:text-[#171717]'
        }`}
        title="Stroke Eraser (E)"
      >
        <Eraser size={14} />
      </button>

      <div className="w-[1px] h-4 bg-[#D8D4CA] mx-1" />

      {/* Palette (Visible in Draw Mode) */}
      {isDrawingMode && activeTool !== 'eraser' && (
        <div className="flex items-center gap-1 px-1">
          {PALETTE.map(item => (
            <button
              key={item.name}
              onClick={() => onSelectColor(item.color)}
              className="w-5 h-5 rounded-full transition-transform flex items-center justify-center border"
              style={{
                background: item.color,
                borderColor: item.color === '#FCFAF7' ? '#D8D4CA' : 'transparent',
                transform: activeColor === item.color ? 'scale(1.25)' : 'scale(1)',
                boxShadow: activeColor === item.color ? '0 0 0 1.5px #8A4938' : 'none',
              }}
              title={item.name}
            />
          ))}

          <div className="w-[1px] h-4 bg-[#D8D4CA] mx-1" />

          {/* Stroke Sizes */}
          <div className="flex items-center gap-0.5">
            {SIZES.map(s => (
              <button
                key={s.label}
                onClick={() => onSelectSize(s.value)}
                className={`w-6 h-6 rounded-full text-[10px] font-mono flex items-center justify-center transition-colors ${
                  activeSize === s.value ? 'bg-[#ECE8DF] font-bold text-[#8A4938]' : 'text-[#73716B] hover:text-[#171717]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-4 bg-[#D8D4CA] mx-1" />
        </div>
      )}

      {/* Undo & Clear */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors text-[#73716B] hover:text-[#171717] disabled:opacity-30"
        title="Undo Stroke (⌘Z)"
      >
        <RotateCcw size={13} />
      </button>

      <button
        onClick={() => {
          if (window.confirm('Clear all sketches from this world canvas?')) {
            onClear();
          }
        }}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors text-[#9B3D3D] hover:bg-red-50"
        title="Clear Sketches"
      >
        <Trash2 size={13} />
      </button>
    </motion.div>
  );
}

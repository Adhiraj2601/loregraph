'use client';

import React, { memo, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { getStroke } from 'perfect-freehand';
import { NODE_TYPE_CONFIG } from '@/lib/nodeTypes';
import { NodeType } from '@/types/node';
import { DrawingStroke } from '@/types/drawing';
import { getSvgPathFromStroke } from '@/components/graph/DrawingCanvas';

export interface LoreNodeData {
  title: string;
  type: NodeType;
  isRoot?: boolean;
  selected?: boolean;
  isExploreMode?: boolean;
  isDimmed?: boolean;
  tags?: string[];
  strokes?: DrawingStroke[];
  [key: string]: unknown;
}

const LoreGraphNode = memo(function LoreGraphNode({ data, selected }: NodeProps) {
  const nodeData = data as LoreNodeData;
  const config = NODE_TYPE_CONFIG[nodeData.type] ?? NODE_TYPE_CONFIG.CONCEPT;
  const isRoot = nodeData.isRoot;
  const isDimmed = nodeData.isDimmed;
  const isSketch = nodeData.type === 'SKETCH';
  const strokes = nodeData.strokes ?? [];

  // Compute bounding box / viewBox for miniature SVG thumbnail
  const svgViewBox = useMemo(() => {
    if (!strokes || strokes.length === 0) return '0 0 160 90';
    let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    strokes.forEach(s => {
      s.points.forEach(([x, y]) => {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      });
    });
    if (!isFinite(minX)) return '0 0 160 90';
    const padding = 15;
    const width = Math.max(maxX - minX + padding * 2, 80);
    const height = Math.max(maxY - minY + padding * 2, 45);
    return `${minX - padding} ${minY - padding} ${width} ${height}`;
  }, [strokes]);

  return (
    <div
      className="relative transition-all duration-200 group"
      style={{
        opacity: isDimmed ? 0.25 : 1,
      }}
    >
      {/* Top Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-[#FCFAF7] !border-[1.5px] !border-[#8A4938] opacity-0 group-hover:opacity-100 transition-all hover:!scale-150"
        style={{ top: '-5px' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!w-2.5 !h-2.5 !bg-[#FCFAF7] !border-[1.5px] !border-[#8A4938] opacity-0 group-hover:opacity-100 transition-all hover:!scale-150"
        style={{ top: '-5px' }}
      />

      {/* Bottom Handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-[#FCFAF7] !border-[1.5px] !border-[#8A4938] opacity-0 group-hover:opacity-100 transition-all hover:!scale-150"
        style={{ bottom: '-5px' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!w-2.5 !h-2.5 !bg-[#FCFAF7] !border-[1.5px] !border-[#8A4938] opacity-0 group-hover:opacity-100 transition-all hover:!scale-150"
        style={{ bottom: '-5px' }}
      />

      {/* Left Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-[#FCFAF7] !border-[1.5px] !border-[#8A4938] opacity-0 group-hover:opacity-100 transition-all hover:!scale-150"
        style={{ left: '-5px' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!w-2.5 !h-2.5 !bg-[#FCFAF7] !border-[1.5px] !border-[#8A4938] opacity-0 group-hover:opacity-100 transition-all hover:!scale-150"
        style={{ left: '-5px' }}
      />

      {/* Right Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-[#FCFAF7] !border-[1.5px] !border-[#8A4938] opacity-0 group-hover:opacity-100 transition-all hover:!scale-150"
        style={{ right: '-5px' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-2.5 !h-2.5 !bg-[#FCFAF7] !border-[1.5px] !border-[#8A4938] opacity-0 group-hover:opacity-100 transition-all hover:!scale-150"
        style={{ right: '-5px' }}
      />

      {isRoot ? (
        /* ─── ROOT WORLD NODE ─── */
        <div
          className="relative px-4 py-2.5 rounded-md transition-all cursor-pointer select-none text-center"
          style={{
            background: selected ? 'var(--surface)' : 'rgba(252, 250, 247, 0.95)',
            border: `1.5px solid ${selected ? 'var(--accent-rust)' : 'var(--border)'}`,
            boxShadow: selected
              ? '0 0 0 3px rgba(138, 73, 56, 0.12), 0 2px 8px rgba(0,0,0,0.04)'
              : '0 1px 4px rgba(0,0,0,0.03)',
            minWidth: '140px',
            maxWidth: '220px',
          }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <span
              className="text-xs"
              style={{ color: 'var(--accent-rust)' }}
            >
              ✻
            </span>
            <span
              className="font-mono text-[9px] uppercase tracking-widest font-semibold"
              style={{ color: 'var(--accent-rust)', letterSpacing: '0.15em' }}
            >
              WORLD
            </span>
          </div>

          <div
            className="font-serif text-base sm:text-lg font-medium leading-tight truncate px-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {nodeData.title}
          </div>
        </div>
      ) : isSketch ? (
        /* ─── SKETCH NOTE CARD ─── */
        <div
          className="relative p-2.5 rounded-md transition-all cursor-pointer select-none"
          style={{
            background: selected ? 'var(--surface)' : 'rgba(252, 250, 247, 0.96)',
            border: `1.5px solid ${selected ? 'var(--accent-rust)' : 'var(--border)'}`,
            boxShadow: selected
              ? '0 0 0 2.5px rgba(138, 73, 56, 0.15), 0 2px 8px rgba(0,0,0,0.05)'
              : '0 1px 4px rgba(0,0,0,0.03)',
            width: '165px',
          }}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between gap-1 mb-1.5 px-0.5">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[11px]" style={{ color: config.color }}>✎</span>
              <span className="font-serif text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {nodeData.title}
              </span>
            </div>
            <span className="font-mono text-[8px] uppercase tracking-wider px-1 py-0.2 rounded" style={{ color: config.color, background: config.bg }}>
              SKETCH
            </span>
          </div>

          {/* SVG Artwork Thumbnail Box */}
          <div
            className="w-full h-[85px] rounded overflow-hidden border flex items-center justify-center relative transition-colors"
            style={{
              background: '#FAF8F4',
              borderColor: 'var(--border-light)',
            }}
          >
            {strokes.length > 0 ? (
              <svg
                viewBox={svgViewBox}
                className="w-full h-full p-1"
                preserveAspectRatio="xMidYMid meet"
              >
                {strokes.map(stroke => {
                  const outline = getStroke(stroke.points, {
                    size: stroke.tool === 'highlighter' ? stroke.size * 2 : stroke.size,
                    thinning: 0.3,
                    smoothing: 0.6,
                    streamline: 0.5,
                  });
                  return (
                    <path
                      key={stroke.id}
                      d={getSvgPathFromStroke(outline)}
                      fill={stroke.color}
                      opacity={stroke.opacity ?? 0.95}
                    />
                  );
                })}
              </svg>
            ) : (
              <div className="text-center p-2">
                <span className="text-base block mb-0.5" style={{ color: 'var(--text-tertiary)' }}>✎</span>
                <span className="font-serif italic text-[10px] block" style={{ color: 'var(--text-tertiary)' }}>
                  Empty Sketch
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── NOTEBOOK DIAGRAM CHILD NODE ─── */
        <div
          className="relative px-3 py-2 rounded transition-all cursor-pointer select-none flex items-baseline gap-2"
          style={{
            background: selected ? 'var(--surface)' : 'rgba(252, 250, 247, 0.9)',
            border: `1px solid ${selected ? 'var(--accent-rust)' : 'var(--border)'}`,
            boxShadow: selected ? '0 0 0 2px rgba(138, 73, 56, 0.15), 0 1px 4px rgba(0,0,0,0.03)' : '0 1px 3px rgba(0,0,0,0.02)',
            maxWidth: '190px',
          }}
        >
          {/* Subtle category symbol / dot */}
          <span
            className="text-[11px] flex-shrink-0"
            style={{ color: config.color }}
          >
            {config.symbol}
          </span>

          <span
            className="text-xs font-normal leading-snug group-hover:text-[#8A4938] transition-colors truncate"
            style={{
              color: selected ? 'var(--text-primary)' : '#2D2B29',
              fontWeight: selected ? 500 : 400,
            }}
          >
            {nodeData.title}
          </span>
        </div>
      )}
    </div>
  );
});

export { LoreGraphNode };
export const nodeTypes = { loreNode: LoreGraphNode };

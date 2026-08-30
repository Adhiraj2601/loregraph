'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NODE_TYPE_CONFIG } from '@/lib/nodeTypes';
import { NodeType } from '@/types/node';

export interface LoreNodeData {
  title: string;
  type: NodeType;
  isRoot?: boolean;
  selected?: boolean;
  isExploreMode?: boolean;
  isDimmed?: boolean;
  tags?: string[];
  [key: string]: unknown;
}

const LoreGraphNode = memo(function LoreGraphNode({ data, selected }: NodeProps) {
  const nodeData = data as LoreNodeData;
  const config = NODE_TYPE_CONFIG[nodeData.type] ?? NODE_TYPE_CONFIG.CONCEPT;
  const isRoot = nodeData.isRoot;
  const isDimmed = nodeData.isDimmed;

  return (
    <div
      className="relative transition-all duration-200 group"
      style={{
        opacity: isDimmed ? 0.25 : 1,
      }}
    >
      {/* Visible Interactive Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="!w-2.5 !h-2.5 !bg-[#FCFAF7] !border-[1.5px] !border-[#8A4938] opacity-0 group-hover:opacity-100 transition-all hover:!scale-150"
        style={{ top: '-5px' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-2.5 !h-2.5 !bg-[#FCFAF7] !border-[1.5px] !border-[#8A4938] opacity-0 group-hover:opacity-100 transition-all hover:!scale-150"
        style={{ left: '-5px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-2.5 !h-2.5 !bg-[#FCFAF7] !border-[1.5px] !border-[#8A4938] opacity-0 group-hover:opacity-100 transition-all hover:!scale-150"
        style={{ right: '-5px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="!w-2.5 !h-2.5 !bg-[#FCFAF7] !border-[1.5px] !border-[#8A4938] opacity-0 group-hover:opacity-100 transition-all hover:!scale-150"
        style={{ bottom: '-5px' }}
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

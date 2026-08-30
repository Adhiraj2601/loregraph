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
      className="relative transition-all duration-200"
      style={{
        opacity: isDimmed ? 0.25 : 1,
      }}
    >
      {/* React Flow Connection Handles (almost invisible) */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      {isRoot ? (
        /* ─── ROOT WORLD NODE ─── */
        <div
          className="relative px-3.5 py-2 rounded-md transition-all cursor-pointer select-none group text-center"
          style={{
            background: selected ? 'var(--surface)' : 'rgba(252, 250, 247, 0.9)',
            border: `1.5px solid ${selected ? 'var(--accent-rust)' : 'var(--border)'}`,
            boxShadow: selected
              ? '0 0 0 3px rgba(138, 73, 56, 0.12), 0 2px 8px rgba(0,0,0,0.04)'
              : '0 1px 4px rgba(0,0,0,0.03)',
            minWidth: '130px',
            maxWidth: '200px',
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
              className="font-mono text-[9px] uppercase tracking-widest"
              style={{ color: 'var(--accent-rust)', letterSpacing: '0.15em' }}
            >
              WORLD
            </span>
          </div>

          <div
            className="font-serif text-sm sm:text-base font-medium leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {nodeData.title}
          </div>
        </div>
      ) : (
        /* ─── NOTEBOOK DIAGRAM CHILD NODE ─── */
        <div
          className="relative px-2.5 py-1.5 rounded transition-all cursor-pointer select-none group flex items-baseline gap-1.5"
          style={{
            background: selected ? 'var(--surface)' : 'rgba(244, 241, 234, 0.85)',
            border: `1px solid ${selected ? 'var(--accent-rust)' : 'transparent'}`,
            boxShadow: selected ? '0 0 0 2px rgba(138, 73, 56, 0.15)' : 'none',
            maxWidth: '170px',
          }}
        >
          {/* Subtle category symbol / dot */}
          <span
            className="text-[10px] flex-shrink-0"
            style={{ color: config.color }}
          >
            {config.symbol}
          </span>

          <span
            className="text-xs font-normal leading-snug group-hover:text-[#8A4938] transition-colors"
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

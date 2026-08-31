'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  useReactFlow,
  EdgeLabelRenderer,
  BaseEdge,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { LoreNode } from '@/types/node';
import type { LoreEdge as LoreEdgeType } from '@/types/edge';
import { LoreNodeData, nodeTypes } from '@/components/nodes/LoreGraphNode';
import { nodeRepo, edgeRepo } from '@/lib/storage/repository';
import { DrawingCanvas } from '@/components/graph/DrawingCanvas';
import { DrawingStroke, DrawingTool } from '@/types/drawing';

// ─── Local debounce ──────────────────────────────────────────────────────────

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── Delicate Interactive Notebook Edge ──────────────────────────────────────

function LoreEdgeComponent({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected, markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const label = (data as { relationship?: string })?.relationship || 'connected to';
  const onUpdateRelationship = (data as { onUpdateRelationship?: (id: string, rel: string) => void })?.onUpdateRelationship;
  const onDeleteEdge = (data as { onDeleteEdge?: (id: string) => void })?.onDeleteEdge;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);

  useEffect(() => {
    setEditValue(label);
  }, [label]);

  const handleSave = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== label && onUpdateRelationship) {
      onUpdateRelationship(id, trimmed);
    }
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected || isEditing ? '#8A4938' : '#B8B3A8',
          strokeWidth: selected || isEditing ? 1.75 : 1,
          opacity: selected || isEditing ? 1 : 0.75,
        }}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            fontSize: '10px',
            fontFamily: 'JetBrains Mono, monospace',
            background: 'rgba(252, 250, 247, 0.98)',
            padding: '2px 7px',
            borderRadius: '4px',
            border: `1px solid ${selected || isEditing ? '#8A4938' : 'var(--border)'}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            zIndex: 10,
          }}
          className="nodrag nopan group flex items-center gap-1.5 cursor-pointer transition-all hover:border-[#8A4938] hover:shadow-md"
        >
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') { setEditValue(label); setIsEditing(false); }
              }}
              className="bg-transparent text-xs font-mono text-[#8A4938] focus:outline-none border-b border-[#8A4938] px-0.5 min-w-[90px]"
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="hover:text-[#8A4938] transition-colors select-none"
                style={{ color: selected ? '#8A4938' : '#73716B' }}
                title="Click to rename relationship"
              >
                {label}
              </span>
              {onDeleteEdge && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEdge(id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-[#9B3D3D] hover:bg-red-50 rounded text-[10px] leading-none"
                  title="Delete relation"
                >
                  ✕
                </button>
              )}
            </>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = { loreEdge: LoreEdgeComponent };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toFlowNodes(loreNodes: LoreNode[], selectedId?: string, isExplore?: boolean): Node[] {
  return loreNodes.map(n => ({
    id: n.id,
    type: 'loreNode',
    position: n.position,
    data: {
      title: n.title,
      type: n.type,
      isRoot: n.isRoot,
      tags: n.tags,
      strokes: n.strokes,
      isDimmed: false,
    } satisfies LoreNodeData,
    selected: n.id === selectedId,
  }));
}

function toFlowEdges(
  loreEdges: LoreEdgeType[],
  onUpdateRelationship?: (id: string, rel: string) => void,
  onDeleteEdge?: (id: string) => void
): Edge[] {
  return loreEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle || undefined,
    targetHandle: e.targetHandle || undefined,
    type: 'loreEdge',
    data: {
      relationship: e.relationship || 'connected to',
      onUpdateRelationship,
      onDeleteEdge,
    },
  }));
}

// ─── Main Graph Canvas ───────────────────────────────────────────────────────

interface GraphCanvasProps {
  ideaId: string;
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  onCanvasClick: () => void;
  isExploreMode: boolean;
  isDrawingMode?: boolean;
  activeTool?: DrawingTool;
  activeColor?: string;
  activeSize?: number;
  strokes?: DrawingStroke[];
  onStrokesChange?: (strokes: DrawingStroke[]) => void;
  refreshKey?: number;
}

export function GraphCanvas({
  ideaId,
  selectedNodeId,
  onNodeClick,
  onCanvasClick,
  isExploreMode,
  isDrawingMode = false,
  activeTool = 'pen',
  activeColor = '#8A4938',
  activeSize = 4,
  strokes = [],
  onStrokesChange,
  refreshKey,
}: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView, setCenter } = useReactFlow();

  // Debounced position save
  const savePositionsDebounced = useRef(
    debounce((updatedNodes: Node[]) => {
      updatedNodes.forEach(n => {
        nodeRepo.update(n.id, { position: n.position as { x: number; y: number } });
      });
    }, 500)
  ).current;

  const handleUpdateRelationship = useCallback((id: string, relationship: string) => {
    edgeRepo.update(id, { relationship });
    const loreEdges = edgeRepo.getAllByIdeaId(ideaId);
    setEdges(toFlowEdges(loreEdges, handleUpdateRelationship, handleDeleteEdge));
  }, [ideaId, setEdges]);

  const handleDeleteEdge = useCallback((id: string) => {
    edgeRepo.delete(id);
    const loreEdges = edgeRepo.getAllByIdeaId(ideaId);
    setEdges(toFlowEdges(loreEdges, handleUpdateRelationship, handleDeleteEdge));
  }, [ideaId, setEdges, handleUpdateRelationship]);

  // Load data
  const loadGraph = useCallback(() => {
    const loreNodes = nodeRepo.getAllByIdeaId(ideaId);
    const loreEdges = edgeRepo.getAllByIdeaId(ideaId);
    setNodes(toFlowNodes(loreNodes, selectedNodeId ?? undefined, isExploreMode));
    setEdges(toFlowEdges(loreEdges, handleUpdateRelationship, handleDeleteEdge));
  }, [ideaId, selectedNodeId, isExploreMode, setNodes, setEdges, handleUpdateRelationship, handleDeleteEdge]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph, refreshKey]);

  // Fit view on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 100);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaId]);

  // Dim non-connected nodes in explore mode
  useEffect(() => {
    if (!isExploreMode || !selectedNodeId) {
      setNodes(ns => ns.map(n => ({ ...n, data: { ...n.data, isDimmed: false } })));
      return;
    }
    const loreEdges = edgeRepo.getAllByIdeaId(ideaId);
    const connected = new Set<string>([selectedNodeId]);
    loreEdges.forEach(e => {
      if (e.source === selectedNodeId) connected.add(e.target);
      if (e.target === selectedNodeId) connected.add(e.source);
    });
    setNodes(ns => ns.map(n => ({
      ...n,
      data: { ...n.data, isDimmed: !connected.has(n.id) },
    })));
  }, [selectedNodeId, isExploreMode, ideaId, setNodes]);

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      const hasDragEnd = changes.some(c => c.type === 'position' && !('dragging' in c && c.dragging));
      if (hasDragEnd) {
        setNodes(ns => { savePositionsDebounced(ns); return ns; });
      }
    },
    [onNodesChange, setNodes, savePositionsDebounced]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const relInput = window.prompt('Name this relationship (e.g. "wields", "allied with", "created by"):', 'connected to');
      if (relInput === null) return; // User cancelled
      const relationship = relInput.trim() || 'connected to';
      const edge = edgeRepo.create({
        ideaId,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle || null,
        targetHandle: connection.targetHandle || null,
        relationship,
      });
      const loreEdges = edgeRepo.getAllByIdeaId(ideaId);
      setEdges(toFlowEdges(loreEdges, handleUpdateRelationship, handleDeleteEdge));
    },
    [ideaId, setEdges, handleUpdateRelationship, handleDeleteEdge]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (isDrawingMode) return;
      onNodeClick(node.id);
      if (isExploreMode) {
        setCenter(node.position.x + 60, node.position.y + 20, { zoom: 1.25, duration: 500 });
      }
    },
    [onNodeClick, isExploreMode, isDrawingMode, setCenter]
  );

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (isDrawingMode) return;
      setCenter(node.position.x + 60, node.position.y + 20, { zoom: 1.4, duration: 500 });
    },
    [isDrawingMode, setCenter]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={handleNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={handleNodeClick}
      onNodeDoubleClick={handleNodeDoubleClick}
      onPaneClick={() => {
        if (!isDrawingMode) onCanvasClick();
      }}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={!isExploreMode && !isDrawingMode}
      nodesConnectable={!isExploreMode && !isDrawingMode}
      elementsSelectable={!isDrawingMode}
      panOnDrag={!isDrawingMode}
      selectionOnDrag={false}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={2.5}
      defaultEdgeOptions={{ type: 'loreEdge' }}
      proOptions={{ hideAttribution: true }}
      style={{ background: 'var(--bg)' }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={0.75}
        color="rgba(162, 158, 149, 0.45)"
      />

      {/* Freehand Vector Drawing Layer */}
      <DrawingCanvas
        ideaId={ideaId}
        strokes={strokes}
        onStrokesChange={onStrokesChange || (() => {})}
        isDrawingMode={isDrawingMode}
        activeTool={activeTool}
        activeColor={activeColor}
        activeSize={activeSize}
      />
    </ReactFlow>
  );
}

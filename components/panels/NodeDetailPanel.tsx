'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Edit3, Trash2, Focus, Plus, Check, PenTool, Highlighter, Eraser, RotateCcw, Image as ImageIcon, Upload, Loader2, Maximize2, ChevronDown, ChevronRight } from 'lucide-react';
import { getStroke } from 'perfect-freehand';
import { LoreNode } from '@/types/node';
import { LoreEdge } from '@/types/edge';
import { DrawingStroke, DrawingTool } from '@/types/drawing';
import { NODE_TYPE_CONFIG, NODE_TYPES_LIST } from '@/lib/nodeTypes';
import { formatDate, formatRelativeTime, generateId } from '@/lib/utils';
import { edgeRepo } from '@/lib/storage/repository';
import { getSvgPathFromStroke } from '@/components/graph/DrawingCanvas';
import { uploadEntityImage } from '@/lib/imageStorage';

// ─── Embedded Node Sketchpad ──────────────────────────────────────────────────

const SKETCH_PALETTE = [
  { name: 'Charcoal', color: '#171717' },
  { name: 'Rust', color: '#8A4938' },
  { name: 'Slate', color: '#596A72' },
  { name: 'Ochre', color: '#9E6B47' },
  { name: 'Sage', color: '#657560' },
];

function NodeSketchpad({
  nodeId,
  strokes = [],
  onChangeStrokes,
}: {
  nodeId: string;
  strokes: DrawingStroke[];
  onChangeStrokes: (strokes: DrawingStroke[]) => void;
}) {
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState('#8A4938');
  const [size, setSize] = useState(4);
  const [currentPoints, setCurrentPoints] = useState<number[][] | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isDownRef = useRef(false);

  const getPoint = (e: React.PointerEvent) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
    return [x, y, pressure];
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const pt = getPoint(e);
    if (!pt) return;
    isDownRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (tool === 'eraser') {
      const radius = size * 5;
      const remaining = strokes.filter(s => !s.points.some(([px, py]) => Math.hypot(px - pt[0], py - pt[1]) < radius));
      if (remaining.length !== strokes.length) onChangeStrokes(remaining);
      return;
    }

    setCurrentPoints([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDownRef.current) return;
    const pt = getPoint(e);
    if (!pt) return;

    if (tool === 'eraser') {
      const radius = size * 5;
      const remaining = strokes.filter(s => !s.points.some(([px, py]) => Math.hypot(px - pt[0], py - pt[1]) < radius));
      if (remaining.length !== strokes.length) onChangeStrokes(remaining);
      return;
    }

    setCurrentPoints(pts => (pts ? [...pts, pt] : [pt]));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDownRef.current) return;
    isDownRef.current = false;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}

    if (currentPoints && currentPoints.length > 0 && tool !== 'eraser') {
      const newStroke: DrawingStroke = {
        id: generateId(),
        ideaId: nodeId,
        points: currentPoints,
        color,
        size,
        tool,
        opacity: tool === 'highlighter' ? 0.35 : 0.95,
        createdAt: new Date().toISOString(),
      };
      onChangeStrokes([...strokes, newStroke]);
    }
    setCurrentPoints(null);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    onChangeStrokes(strokes.slice(0, -1));
  };

  const handleClear = () => {
    if (window.confirm('Clear sketchpad for this idea?')) {
      onChangeStrokes([]);
    }
  };

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)', background: '#FAF8F4' }}>
      {/* Mini Sketchpad Controls Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-[var(--surface)]" style={{ borderColor: 'var(--border-light)' }}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`p-1.5 rounded transition-colors ${tool === 'pen' ? 'bg-[#ECE8DF] text-[#8A4938]' : 'text-[#73716B]'}`}
            title="Pen"
          >
            <PenTool size={13} />
          </button>
          <button
            type="button"
            onClick={() => setTool('highlighter')}
            className={`p-1.5 rounded transition-colors ${tool === 'highlighter' ? 'bg-[#ECE8DF] text-[#8A4938]' : 'text-[#73716B]'}`}
            title="Highlighter"
          >
            <Highlighter size={13} />
          </button>
          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded transition-colors ${tool === 'eraser' ? 'bg-[#ECE8DF] text-[#8A4938]' : 'text-[#73716B]'}`}
            title="Eraser"
          >
            <Eraser size={13} />
          </button>
        </div>

        {/* Color Palette */}
        {tool !== 'eraser' && (
          <div className="flex items-center gap-1">
            {SKETCH_PALETTE.map(p => (
              <button
                key={p.name}
                type="button"
                onClick={() => setColor(p.color)}
                className="w-4 h-4 rounded-full border transition-transform"
                style={{
                  background: p.color,
                  borderColor: color === p.color ? '#8A4938' : 'transparent',
                  transform: color === p.color ? 'scale(1.2)' : 'scale(1)',
                }}
                title={p.name}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="p-1 rounded text-[#73716B] hover:text-[#171717] disabled:opacity-30"
            title="Undo"
          >
            <RotateCcw size={12} />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="p-1 rounded text-[#9B3D3D] hover:bg-red-50 disabled:opacity-30"
            title="Clear"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Drawing Canvas Area */}
      <svg
        ref={svgRef}
        className="w-full h-44 cursor-crosshair touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Render Saved Strokes */}
        {strokes.map(s => {
          const outline = getStroke(s.points, {
            size: s.tool === 'highlighter' ? s.size * 2.5 : s.size,
            thinning: 0.35,
            smoothing: 0.6,
            streamline: 0.5,
          });
          return (
            <path
              key={s.id}
              d={getSvgPathFromStroke(outline)}
              fill={s.color}
              opacity={s.opacity ?? (s.tool === 'highlighter' ? 0.35 : 0.95)}
            />
          );
        })}

        {/* Live Active Stroke */}
        {currentPoints && currentPoints.length > 0 && tool !== 'eraser' && (
          <path
            d={getSvgPathFromStroke(getStroke(currentPoints, {
              size: tool === 'highlighter' ? size * 2.5 : size,
              thinning: 0.35,
              smoothing: 0.6,
              streamline: 0.5,
            }))}
            fill={color}
            opacity={tool === 'highlighter' ? 0.35 : 0.95}
          />
        )}
      </svg>
    </div>
  );
}

// ─── Main Node Detail Panel ──────────────────────────────────────────────────

interface NodeDetailPanelProps {
  node: LoreNode;
  edges: LoreEdge[];
  allNodes: LoreNode[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<LoreNode>) => void;
  onFocus: (id: string) => void;
  isMobile?: boolean;
}

export function NodeDetailPanel({
  node,
  edges,
  allNodes,
  onClose,
  onDelete,
  onUpdate,
  onFocus,
}: NodeDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [editDesc, setEditDesc] = useState(node.description);
  const [editType, setEditType] = useState(node.type);
  const [editImageUrl, setEditImageUrl] = useState<string | undefined>(node.imageUrl);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Determine if this idea already has attached visual media (sketch or image)
  const hasSketch = Boolean(node.strokes && node.strokes.length > 0);
  const hasImage = Boolean(node.imageUrl || editImageUrl);
  const isMediaNodeType = node.type === 'SKETCH' || node.type === 'IMAGE' || editType === 'SKETCH' || editType === 'IMAGE';
  const hasMedia = hasSketch || hasImage || isMediaNodeType;

  // Media section collapsed by default if empty; automatically expanded if media exists
  const [isMediaExpanded, setIsMediaExpanded] = useState<boolean>(hasMedia);

  // Connect Idea inline state
  const [isConnecting, setIsConnecting] = useState(false);
  const [targetNodeId, setTargetNodeId] = useState('');
  const [relationshipText, setRelationshipText] = useState('');

  const config = NODE_TYPE_CONFIG[node.type] ?? NODE_TYPE_CONFIG.CONCEPT;

  // Connected nodes
  const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
  const connectedNodes = connectedEdges.map(e => {
    const otherId = e.source === node.id ? e.target : e.source;
    const other = allNodes.find(n => n.id === otherId);
    return { node: other, edge: e, direction: e.source === node.id ? 'out' : 'in' as const };
  }).filter(c => c.node);

  // Unconnected candidate nodes
  const connectedIds = new Set(connectedNodes.map(c => c.node?.id).concat([node.id]));
  const availableCandidates = allNodes.filter(n => !connectedIds.has(n.id));

  useEffect(() => {
    setEditTitle(node.title);
    setEditDesc(node.description);
    setEditType(node.type);
    setEditImageUrl(node.imageUrl);
    setIsEditing(false);
    setConfirmDelete(false);
    setIsConnecting(false);
    setTargetNodeId(availableCandidates[0]?.id || '');
    setRelationshipText('');
    const curHasMedia = Boolean((node.strokes && node.strokes.length > 0) || node.imageUrl || node.type === 'SKETCH' || node.type === 'IMAGE');
    setIsMediaExpanded(curHasMedia);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, node.title, node.description, node.type, node.imageUrl, node.strokes]);

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsUploadingImage(true);
    try {
      const url = await uploadEntityImage(node.ideaId, file, node.id);
      setEditImageUrl(url);
      setIsMediaExpanded(true);
      if (!isEditing) {
        onUpdate(node.id, { imageUrl: url });
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = () => {
    onUpdate(node.id, {
      title: editTitle.trim() || node.title,
      description: editDesc.trim(),
      type: editType,
      imageUrl: editImageUrl,
    });
    setIsEditing(false);
  };

  const handleCreateConnection = () => {
    if (!targetNodeId) return;
    edgeRepo.create({
      ideaId: node.ideaId,
      source: node.id,
      target: targetNodeId,
      relationship: relationshipText.trim() || '',
    });
    setIsConnecting(false);
    setRelationshipText('');
    onUpdate(node.id, {}); // Trigger refresh
  };

  const handleDeleteConnection = (edgeId: string) => {
    edgeRepo.delete(edgeId);
    onUpdate(node.id, {}); // Trigger refresh
  };

  const handleStrokesUpdate = (newStrokes: DrawingStroke[]) => {
    onUpdate(node.id, { strokes: newStrokes });
  };

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
      }}
    >
      {/* Top Header */}
      <div
        className="px-6 py-4 border-b flex-shrink-0 flex items-center justify-between"
        style={{ borderColor: 'var(--border-light)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ color: config.color, fontSize: '14px' }}>{config.symbol}</span>
          <span
            className="font-mono text-[10px] uppercase tracking-widest font-semibold truncate"
            style={{ color: 'var(--text-secondary)' }}
          >
            {node.isRoot ? 'World' : config.label}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[#ECE8DF] transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          title="Close panel"
        >
          <X size={15} />
        </button>
      </div>

      {/* Main Manuscript Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Title */}
        <div>
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full font-serif text-2xl font-normal bg-transparent border-b pb-1 focus:outline-none focus:border-[#8A4938]"
              style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              placeholder="Idea title..."
              autoFocus
            />
          ) : (
            <h1
              className="font-serif text-2xl font-normal leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {node.title}
            </h1>
          )}
        </div>

        {/* Category Switcher (in Edit mode) */}
        {isEditing && !node.isRoot && (
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
              Category
            </span>
            <div className="grid grid-cols-2 gap-1">
              {NODE_TYPES_LIST.map(type => {
                const conf = NODE_TYPE_CONFIG[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEditType(type)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-left transition-colors border"
                    style={{
                      borderColor: editType === type ? 'var(--accent-rust)' : 'var(--border-light)',
                      background: editType === type ? '#ECE8DF' : 'transparent',
                      color: editType === type ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ color: conf.color }}>{conf.symbol}</span>
                    <span className="truncate">{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Collapsible Attached Artwork / Sketch Section ─── */}
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-light)' }}>
          {/* Section Header / Expandable Toggle */}
          <button
            type="button"
            onClick={() => setIsMediaExpanded(v => !v)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors hover:bg-[#FAF8F4]"
            style={{ background: 'var(--surface)' }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-tertiary)' }}>
                {isMediaExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Attached Artwork & Sketch
              </span>
            </div>

            <div className="flex items-center gap-2">
              {hasSketch && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#ECE8DF]" style={{ color: 'var(--accent-rust)' }}>
                  {node.strokes?.length} strokes
                </span>
              )}
              {hasImage && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#ECE8DF]" style={{ color: '#4A6B82' }}>
                  Image
                </span>
              )}
              {!hasMedia && !isMediaExpanded && (
                <span className="text-[11px] font-mono" style={{ color: 'var(--accent-rust)' }}>
                  + Add
                </span>
              )}
            </div>
          </button>

          {/* Expanded Content Area */}
          {isMediaExpanded && (
            <div className="p-3.5 space-y-4 border-t bg-[#FAF8F4]/30" style={{ borderColor: 'var(--border-light)' }}>
              {/* Image Upload Area */}
              <div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                />

                {editImageUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1">
                        <ImageIcon size={11} />
                        <span>Entity Image</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsLightboxOpen(true)}
                          className="text-[10px] font-mono text-[#4A6B82] hover:underline flex items-center gap-1"
                        >
                          <Maximize2 size={10} />
                          <span>View full</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditImageUrl(undefined);
                            onUpdate(node.id, { imageUrl: undefined });
                          }}
                          className="text-[10px] font-mono text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div
                      className="relative rounded-lg overflow-hidden border group bg-[#FAF8F4]"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editImageUrl}
                        alt={node.title}
                        className="w-full h-40 object-cover cursor-pointer group-hover:brightness-95 transition-all"
                        onClick={() => setIsLightboxOpen(true)}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded border border-dashed border-[var(--border)] hover:border-[#4A6B82] flex items-center justify-center gap-2 text-xs font-mono transition-colors bg-[var(--surface)] hover:bg-[#ECE8DF]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-[#8A4938]" />
                        <span>Uploading image...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={13} className="text-[#4A6B82]" />
                        <span>Upload reference image</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Sketchpad Area */}
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-wider mb-1.5 text-[var(--text-tertiary)]">
                  Freehand Sketchpad
                </span>
                <NodeSketchpad
                  nodeId={node.id}
                  strokes={node.strokes || []}
                  onChangeStrokes={handleStrokesUpdate}
                />
              </div>
            </div>
          )}
        </div>

        {/* Description / Manuscript */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Description
            </span>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-[11px] font-mono hover:underline flex items-center gap-1"
                style={{ color: 'var(--accent-rust)' }}
              >
                <Edit3 size={11} />
                <span>Edit</span>
              </button>
            )}
          </div>

          {isEditing ? (
            <textarea
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={6}
              className="w-full p-3 text-xs font-serif leading-relaxed bg-transparent border rounded focus:outline-none focus:border-[#8A4938] resize-none"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              placeholder="Record details, history, capabilities, or secrets..."
            />
          ) : (
            <p
              className="font-serif text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: node.description ? 'var(--text-primary)' : 'var(--text-tertiary)', fontStyle: node.description ? 'normal' : 'italic' }}
            >
              {node.description || 'No description recorded yet for this idea.'}
            </p>
          )}
        </div>

        {/* Connected Ideas Matrix & Relation Creator */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Connected Ideas ({connectedNodes.length})
            </span>
            {availableCandidates.length > 0 && !isConnecting && (
              <button
                onClick={() => {
                  setTargetNodeId(availableCandidates[0].id);
                  setIsConnecting(true);
                }}
                className="text-[11px] font-mono hover:underline flex items-center gap-1"
                style={{ color: 'var(--accent-rust)' }}
              >
                <Plus size={11} />
                <span>Connect Idea</span>
              </button>
            )}
          </div>

          {/* Connect Idea Inline Form */}
          {isConnecting && (
            <div className="p-3 mb-3 rounded border space-y-2.5" style={{ borderColor: 'var(--border)', background: 'rgba(244, 241, 234, 0.5)' }}>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase" style={{ color: 'var(--text-secondary)' }}>Connect to</label>
                <select
                  value={targetNodeId}
                  onChange={e => setTargetNodeId(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded border bg-[var(--surface)] focus:outline-none focus:border-[#8A4938]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {availableCandidates.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.isRoot ? 'World' : c.type.toLowerCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase" style={{ color: 'var(--text-secondary)' }}>Relationship (Optional)</label>
                <input
                  type="text"
                  value={relationshipText}
                  onChange={e => setRelationshipText(e.target.value)}
                  placeholder="e.g. anatomy of, map of, allied with"
                  className="w-full px-2 py-1 text-xs rounded border bg-[var(--surface)] focus:outline-none focus:border-[#8A4938]"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsConnecting(false)}
                  className="px-2.5 py-1 text-xs rounded border hover:bg-[#ECE8DF]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateConnection}
                  className="px-3 py-1 text-xs rounded text-white font-medium"
                  style={{ background: 'var(--accent-rust)' }}
                >
                  Connect
                </button>
              </div>
            </div>
          )}

          {connectedNodes.length > 0 ? (
            <div className="divide-y rounded border" style={{ borderColor: 'var(--border-light)', background: 'var(--surface)' }}>
              {connectedNodes.map(({ node: cn, edge, direction }) => {
                if (!cn) return null;
                const cc = NODE_TYPE_CONFIG[cn.type] ?? NODE_TYPE_CONFIG.CONCEPT;
                return (
                  <div
                    key={edge.id}
                    className="group flex items-center justify-between px-3 py-2 text-xs hover:bg-[#ECE8DF]/50 transition-colors"
                  >
                    <div
                      onClick={() => onFocus(cn.id)}
                      className="flex items-center gap-2 min-w-0 pr-2 cursor-pointer flex-1"
                    >
                      <span style={{ color: cc.color }}>{cc.symbol}</span>
                      <span className="font-serif font-medium truncate group-hover:text-[#8A4938] transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {cn.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {edge.relationship && (
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                          {direction === 'out' ? '→' : '←'} {edge.relationship}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteConnection(edge.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-red-500 hover:text-red-700"
                        title="Remove connection"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs font-serif italic" style={{ color: 'var(--text-tertiary)' }}>No connected ideas yet.</p>
          )}
        </div>

        {/* Temporal Record */}
        <div className="pt-2 border-t text-[11px] font-mono space-y-1" style={{ borderColor: 'var(--border-light)', color: 'var(--text-tertiary)' }}>
          <div className="flex justify-between">
            <span>Created</span>
            <span>{formatDate(node.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Updated</span>
            <span>{formatRelativeTime(node.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div
        className="px-6 py-4 border-t flex-shrink-0 flex items-center justify-between"
        style={{ borderColor: 'var(--border-light)', background: 'var(--surface)' }}
      >
        {isEditing ? (
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2 rounded text-xs font-medium hover:bg-[#ECE8DF] transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              style={{ background: 'var(--accent-rust)', color: '#FCFAF7' }}
            >
              <Check size={13} />
              <span>Save Changes</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onFocus(node.id)}
                className="px-3 py-1.5 rounded text-xs font-mono transition-colors hover:bg-[#ECE8DF] flex items-center gap-1.5"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                title="Center camera on this idea"
              >
                <Focus size={12} />
                <span>Focus</span>
              </button>
            </div>

            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onDelete(node.id)}
                  className="px-3 py-1.5 rounded text-xs font-medium text-white transition-colors bg-[#9B3D3D]"
                >
                  {node.isRoot ? 'Delete World' : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1.5 rounded text-xs font-mono hover:bg-[#ECE8DF]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 rounded text-xs font-mono transition-colors hover:bg-red-50 text-[#9B3D3D] flex items-center gap-1.5"
                style={{ border: '1px solid transparent' }}
                title={node.isRoot ? 'Delete entire world' : 'Delete this idea'}
              >
                <Trash2 size={12} />
                <span>{node.isRoot ? 'Delete World' : 'Delete'}</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && editImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-editorial-fade"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-10 right-0 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Close preview"
            >
              <X size={20} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={editImageUrl}
              alt={node.title}
              className="max-w-full max-h-[82vh] object-contain rounded shadow-2xl border border-white/10"
            />
            <p className="mt-2 text-xs font-mono text-white/70">
              {node.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

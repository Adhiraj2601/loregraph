'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, Trash2, Copy, Focus, Tag, Plus, Check, Link2, Unlink } from 'lucide-react';
import { LoreNode } from '@/types/node';
import { LoreEdge } from '@/types/edge';
import { NODE_TYPE_CONFIG, NODE_TYPES_LIST } from '@/lib/nodeTypes';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { edgeRepo } from '@/lib/storage/repository';

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
  isMobile,
}: NodeDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [editDesc, setEditDesc] = useState(node.description);
  const [editType, setEditType] = useState(node.type);
  const [editTagInput, setEditTagInput] = useState('');
  const [editTags, setEditTags] = useState<string[]>(node.tags ?? []);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    setEditTags(node.tags ?? []);
    setIsEditing(false);
    setConfirmDelete(false);
    setIsConnecting(false);
    setTargetNodeId(availableCandidates[0]?.id || '');
    setRelationshipText('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, node.title, node.description, node.type, node.tags]);

  const handleSave = () => {
    onUpdate(node.id, {
      title: editTitle.trim() || node.title,
      description: editDesc.trim(),
      type: editType,
      tags: editTags,
    });
    setIsEditing(false);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = editTagInput.trim().replace(/^#/, '');
      if (val && !editTags.includes(val)) {
        setEditTags(prev => [...prev, val]);
        setEditTagInput('');
      }
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditTags(prev => prev.filter(t => t !== tag));
  };

  const handleCreateConnection = () => {
    if (!targetNodeId) return;
    edgeRepo.create({
      ideaId: node.ideaId,
      source: node.id,
      target: targetNodeId,
      relationship: relationshipText.trim() || 'connected to',
    });
    setIsConnecting(false);
    setRelationshipText('');
    onUpdate(node.id, {}); // Trigger refresh
  };

  const handleDeleteConnection = (edgeId: string) => {
    edgeRepo.delete(edgeId);
    onUpdate(node.id, {}); // Trigger refresh
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

        {/* Tags */}
        <div>
          <span className="block text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Tags
          </span>
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editTagInput}
                onChange={e => setEditTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type tag and press Enter..."
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-transparent border rounded focus:outline-none focus:border-[#8A4938]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              <div className="flex flex-wrap gap-1">
                {editTags.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#ECE8DF]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span>#{t}</span>
                    <button onClick={() => handleRemoveTag(t)} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            </div>
          ) : node.tags && node.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {node.tags.map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded text-[11px] font-mono"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}
                >
                  #{t}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs font-serif italic" style={{ color: 'var(--text-tertiary)' }}>No tags</p>
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
                  placeholder="e.g. allied with, created by, located in"
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
    </div>
  );
}

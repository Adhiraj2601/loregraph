'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, Trash2, Copy, Focus, Tag, Plus, Check } from 'lucide-react';
import { LoreNode } from '@/types/node';
import { LoreEdge } from '@/types/edge';
import { NODE_TYPE_CONFIG, NODE_TYPES_LIST } from '@/lib/nodeTypes';
import { formatDate, formatRelativeTime } from '@/lib/utils';

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

  const config = NODE_TYPE_CONFIG[node.type] ?? NODE_TYPE_CONFIG.CONCEPT;

  // Connected nodes
  const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
  const connectedNodes = connectedEdges.map(e => {
    const otherId = e.source === node.id ? e.target : e.source;
    const other = allNodes.find(n => n.id === otherId);
    return { node: other, edge: e, direction: e.source === node.id ? 'out' : 'in' as const };
  }).filter(c => c.node);

  useEffect(() => {
    setEditTitle(node.title);
    setEditDesc(node.description);
    setEditType(node.type);
    setEditTags(node.tags ?? []);
    setIsEditing(false);
    setConfirmDelete(false);
  }, [node.id, node.title, node.description, node.type, node.tags]);

  const handleSave = () => {
    onUpdate(node.id, {
      title: editTitle.trim() || node.title,
      description: editDesc,
      type: editType,
      tags: editTags,
    });
    setIsEditing(false);
  };

  const addTag = () => {
    const t = editTagInput.trim().toLowerCase();
    if (t && !editTags.includes(t)) setEditTags([...editTags, t]);
    setEditTagInput('');
  };

  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-start justify-between px-6 py-5 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border-light)' }}
      >
        <div className="space-y-1 min-w-0 pr-4">
          <div className="flex items-center gap-1.5">
            <span style={{ color: config.color, fontSize: '11px' }}>{config.symbol}</span>
            <span
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{ color: 'var(--text-tertiary)', letterSpacing: '0.15em' }}
            >
              {node.isRoot ? 'Root Concept' : config.label}
            </span>
          </div>

          {isEditing ? (
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full bg-transparent font-serif text-2xl font-medium outline-none border-b pb-1"
              style={{ color: 'var(--text-primary)', borderColor: 'var(--accent-rust)' }}
              autoFocus
            />
          ) : (
            <h2
              className="font-serif text-2xl font-medium leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {node.title}
            </h2>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#ECE8DF] transition-colors flex-shrink-0"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Reading & Editing Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Description Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[10px] font-mono uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
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
              className="w-full bg-transparent font-serif text-base outline-none resize-none leading-relaxed p-3 rounded"
              style={{
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                minHeight: '160px',
              }}
              rows={6}
              placeholder="Write detailed lore..."
            />
          ) : (
            <p
              className="font-serif text-base leading-relaxed whitespace-pre-wrap"
              style={{
                color: node.description ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontStyle: node.description ? 'normal' : 'italic',
              }}
            >
              {node.description || 'No description recorded yet for this idea.'}
            </p>
          )}
        </div>

        {/* Type selector when editing */}
        {isEditing && (
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
              Category
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {NODE_TYPES_LIST.map(t => {
                const c = NODE_TYPE_CONFIG[t];
                return (
                  <button
                    key={t}
                    onClick={() => setEditType(t)}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-all"
                    style={{
                      background: editType === t ? 'var(--surface)' : 'transparent',
                      border: `1px solid ${editType === t ? 'var(--accent-rust)' : 'var(--border-light)'}`,
                      color: editType === t ? 'var(--accent-rust)' : 'var(--text-secondary)',
                    }}
                  >
                    <span>{c.symbol}</span>
                    <span className="font-mono text-[10px] truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <span className="block text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Tags
          </span>
          {isEditing ? (
            <div>
              <div className="flex gap-1.5 mb-2">
                <input
                  value={editTagInput}
                  onChange={e => setEditTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag..."
                  className="flex-1 px-2.5 py-1 rounded text-xs outline-none font-mono"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-2.5 py-1 rounded text-xs hover:bg-[#ECE8DF]"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <Plus size={12} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {editTags.map(t => (
                  <button
                    key={t}
                    onClick={() => setEditTags(editTags.filter(x => x !== t))}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-xs hover:opacity-75 font-mono"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--accent-rust)' }}
                  >
                    <span>{t}</span>
                    <X size={10} />
                  </button>
                ))}
              </div>
            </div>
          ) : node.tags?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {node.tags.map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded text-[11px] font-mono"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}
                >
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs font-serif italic" style={{ color: 'var(--text-tertiary)' }}>No tags</p>
          )}
        </div>

        {/* Connected Ideas Matrix */}
        {connectedNodes.length > 0 && (
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-tertiary)' }}>
              Connected Ideas ({connectedNodes.length})
            </span>
            <div className="divide-y rounded border" style={{ borderColor: 'var(--border-light)', background: 'var(--surface)' }}>
              {connectedNodes.map(({ node: cn, edge, direction }) => {
                if (!cn) return null;
                const cc = NODE_TYPE_CONFIG[cn.type] ?? NODE_TYPE_CONFIG.CONCEPT;
                return (
                  <div
                    key={edge.id}
                    onClick={() => onFocus(cn.id)}
                    className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#ECE8DF]/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span style={{ color: cc.color }}>{cc.symbol}</span>
                      <span className="font-serif font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {cn.title}
                      </span>
                    </div>
                    {edge.relationship && (
                      <span className="text-[10px] font-mono flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                        {direction === 'out' ? '→' : '←'} {edge.relationship}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                className="px-2.5 py-1.5 rounded text-xs font-mono transition-colors hover:bg-[#ECE8DF] flex items-center gap-1"
                style={{ border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}
                title="Center on map"
              >
                <Focus size={12} />
                <span>Focus</span>
              </button>

              <button
                onClick={() => {
                  onUpdate(node.id + '-copy', { ...node, id: undefined as unknown as string, title: node.title + ' (copy)' } as Partial<LoreNode>);
                }}
                className="px-2.5 py-1.5 rounded text-xs font-mono transition-colors hover:bg-[#ECE8DF] flex items-center gap-1"
                style={{ border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}
                title="Duplicate"
              >
                <Copy size={12} />
                <span>Duplicate</span>
              </button>
            </div>

            {confirmDelete ? (
              <button
                onClick={() => onDelete(node.id)}
                className="px-3 py-1.5 rounded text-xs font-mono transition-colors"
                style={{ background: 'var(--danger)', color: '#FFFFFF' }}
              >
                {node.isRoot ? 'Confirm Delete World' : 'Confirm Delete'}
              </button>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-2.5 py-1.5 rounded text-xs font-mono transition-colors hover:bg-[#ECE8DF] flex items-center gap-1 text-[#9B3D3D]"
                style={{ border: '1px solid var(--border-light)' }}
                title={node.isRoot ? "Delete this entire world" : "Delete this idea"}
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

  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-xl overflow-hidden shadow-2xl"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderBottom: 'none',
            maxHeight: '75vh',
          }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1" style={{ background: 'var(--border)' }} />
          {panelContent}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="h-full overflow-hidden"
        style={{
          background: 'var(--bg)',
          borderLeft: '1px solid var(--border)',
        }}
        initial={{ x: 320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 320, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {panelContent}
      </motion.div>
    </AnimatePresence>
  );
}

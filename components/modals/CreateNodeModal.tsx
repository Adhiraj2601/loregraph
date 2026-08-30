'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { NodeType } from '@/types/node';
import { NODE_TYPE_CONFIG, NODE_TYPES_LIST } from '@/lib/nodeTypes';
import { useLoreGraph } from '@/lib/context';

interface CreateNodeModalProps {
  ideaId: string;
  onClose: () => void;
  onCreated?: (nodeId: string) => void;
  defaultPosition?: { x: number; y: number };
}

export function CreateNodeModal({ ideaId, onClose, onCreated, defaultPosition }: CreateNodeModalProps) {
  const { createNode } = useLoreGraph();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<NodeType>('CONCEPT');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    const node = createNode({
      ideaId,
      title: title.trim(),
      description,
      type,
      tags,
      position: defaultPosition ?? {
        x: 350 + (Math.random() * 200 - 100),
        y: 220 + (Math.random() * 200 - 100),
      },
    });
    onCreated?.(node.id);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(23, 23, 23, 0.4)', backdropFilter: 'blur(4px)' }} />

        <motion.div
          className="relative w-full max-w-md rounded-lg overflow-hidden shadow-2xl p-6 sm:p-7"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-2xl font-normal" style={{ color: 'var(--text-primary)' }}>
              Add Idea Branch
            </h2>
            <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}><X size={15} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Title *
              </label>
              <input
                autoFocus
                value={title}
                onChange={e => { setTitle(e.target.value); setError(''); }}
                placeholder="Ash Breath, Queen Aria, etc."
                className="w-full px-3 py-2 rounded text-base font-serif bg-transparent outline-none"
                style={{ border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`, color: 'var(--text-primary)', background: 'var(--bg)' }}
              />
              {error && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{error}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Category
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {NODE_TYPES_LIST.map(t => {
                  const c = NODE_TYPE_CONFIG[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-all"
                      style={{
                        background: type === t ? 'var(--bg)' : 'transparent',
                        border: `1px solid ${type === t ? 'var(--accent-rust)' : 'var(--border-light)'}`,
                        color: type === t ? 'var(--accent-rust)' : 'var(--text-secondary)',
                      }}
                    >
                      <span>{c.symbol}</span>
                      <span className="font-mono text-[10px] truncate">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Lore & Details
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe this concept..."
                rows={3}
                className="w-full px-3 py-2 rounded text-sm font-serif bg-transparent outline-none resize-none leading-relaxed"
                style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', background: 'var(--bg)' }}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Tags
              </label>
              <div className="flex gap-1.5 mb-1.5">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="combat, fire..."
                  className="flex-1 px-3 py-1.5 rounded text-xs font-mono bg-transparent outline-none"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', background: 'var(--bg)' }}
                />
                <button type="button" onClick={addTag} className="px-2.5 py-1 rounded hover:bg-[#ECE8DF]" style={{ border: '1px solid var(--border)' }}>
                  <Plus size={13} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {tags.map(t => (
                  <button key={t} type="button" onClick={() => setTags(tags.filter(x => x !== t))}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono hover:opacity-75"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--accent-rust)' }}
                  >
                    <span>{t}</span><X size={10} />
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
              <button type="button" onClick={onClose} className="flex-1 py-2 rounded text-xs font-medium hover:bg-[#ECE8DF]" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
              <button type="submit" className="flex-1 py-2 rounded text-xs font-medium" style={{ background: 'var(--accent-rust)', color: '#FCFAF7' }}>
                Add Idea
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

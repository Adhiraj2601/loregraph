'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag } from 'lucide-react';
import { useLoreGraph } from '@/lib/context';

interface CreateIdeaModalProps {
  onClose: () => void;
}

export function CreateIdeaModal({ onClose }: CreateIdeaModalProps) {
  const { createIdea, createNode } = useLoreGraph();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    const idea = createIdea({ title: title.trim(), description: description.trim(), tags });
    // Auto-create central root node
    createNode({
      ideaId: idea.id,
      title: title.trim(),
      description: description.trim(),
      type: 'ROOT',
      tags,
      position: { x: 380, y: 260 },
      isRoot: true,
    });
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
          className="relative w-full max-w-md rounded-lg overflow-hidden shadow-2xl p-6 sm:p-8"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl font-normal" style={{ color: 'var(--text-primary)' }}>
                New World
              </h2>
              <p className="text-xs font-serif italic mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Every universe starts with a single thought.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#ECE8DF] transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                World Title *
              </label>
              <input
                autoFocus
                value={title}
                onChange={e => { setTitle(e.target.value); setError(''); }}
                placeholder="The Moon Kingdom"
                className="w-full px-3 py-2 rounded text-base font-serif bg-transparent outline-none transition-colors"
                style={{
                  border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                  color: 'var(--text-primary)',
                  background: 'var(--bg)',
                }}
              />
              {error && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{error}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="A civilization that only exists during lunar eclipses..."
                rows={3}
                className="w-full px-3 py-2 rounded text-sm font-serif bg-transparent outline-none resize-none leading-relaxed"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  background: 'var(--bg)',
                }}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Themes & Tags
              </label>
              <div className="flex gap-1.5 mb-2">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="magic, kingdom, moon..."
                  className="flex-1 px-3 py-1.5 rounded text-xs font-mono bg-transparent outline-none"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', background: 'var(--bg)' }}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-2.5 py-1 rounded text-xs hover:bg-[#ECE8DF]"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <Plus size={13} />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono hover:opacity-75"
                      style={{
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--accent-rust)',
                      }}
                    >
                      <span>{tag}</span>
                      <X size={10} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded text-xs font-medium hover:bg-[#ECE8DF] transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded text-xs font-medium transition-all"
                style={{ background: 'var(--accent-rust)', color: '#FCFAF7' }}
              >
                Begin World
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

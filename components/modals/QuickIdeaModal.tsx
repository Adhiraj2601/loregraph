'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useLoreGraph } from '@/lib/context';

interface QuickIdeaModalProps {
  onClose: () => void;
}

export function QuickIdeaModal({ onClose }: QuickIdeaModalProps) {
  const { createInboxItem } = useLoreGraph();
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (!content.trim()) return;
    createInboxItem({ content: content.trim() });
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
        {/* Archival Backdrop */}
        <div className="absolute inset-0" style={{ background: 'rgba(23, 23, 23, 0.4)', backdropFilter: 'blur(4px)' }} />

        <motion.div
          className="relative w-full max-w-lg rounded-lg overflow-hidden shadow-2xl p-6 sm:p-8"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="font-serif text-2xl font-normal"
              style={{ color: 'var(--text-primary)' }}
            >
              What&apos;s on your mind?
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#ECE8DF] transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X size={15} />
            </button>
          </div>

          <textarea
            autoFocus
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Dragons don't actually die. Their bones slowly grow into mountains..."
            rows={5}
            className="w-full bg-transparent font-serif text-lg outline-none resize-none leading-relaxed mb-4 placeholder:italic"
            style={{ color: 'var(--text-primary)' }}
          />

          <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
              Saved to fragments · ⌘+Enter
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded text-xs hover:bg-[#ECE8DF] transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={!content.trim()}
                className="px-4 py-1.5 rounded text-xs font-medium transition-all disabled:opacity-40"
                style={{ background: 'var(--accent-rust)', color: '#FCFAF7' }}
              >
                Keep this thought
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

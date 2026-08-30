'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

const shortcuts = [
  {
    category: 'Archive Index',
    items: [
      { key: '/', label: 'Search across archive' },
      { key: '?', label: 'Open shortcuts guide' },
      { key: 'Escape', label: 'Close panel or overlay' },
    ],
  },
  {
    category: 'Map & Ideas',
    items: [
      { key: 'N', label: 'Add idea branch' },
      { key: 'Space', label: 'Toggle Explore / Edit mode' },
      { key: 'F', label: 'Fit map to viewport' },
      { key: 'Delete', label: 'Delete selected idea' },
      { key: 'Dbl-Click', label: 'Center & focus camera on idea' },
    ],
  },
  {
    category: 'Quick Thought',
    items: [
      { key: '⌘ + Enter', label: 'Keep thought immediately' },
    ],
  },
];

export function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
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
          className="relative w-full max-w-sm rounded-lg overflow-hidden shadow-2xl p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-2xl font-normal" style={{ color: 'var(--text-primary)' }}>
              Keyboard Guide
            </h2>
            <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}><X size={15} /></button>
          </div>

          <div className="space-y-5">
            {shortcuts.map(section => (
              <div key={section.category}>
                <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
                  {section.category}
                </p>
                <div className="space-y-2">
                  {section.items.map(item => (
                    <div key={item.key} className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                      <kbd
                        className="px-2 py-0.5 rounded text-[11px] font-mono"
                        style={{
                          background: 'var(--bg)',
                          border: '1px solid var(--border-light)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

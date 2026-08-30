'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Trash2, Plus } from 'lucide-react';
import { useLoreGraph } from '@/lib/context';
import { InboxItem } from '@/types/inbox';
import { formatRelativeTime } from '@/lib/utils';
import { ConvertInboxModal } from '@/components/modals/ConvertInboxModal';

interface InboxPanelProps {
  onClose: () => void;
}

export function InboxPanel({ onClose }: InboxPanelProps) {
  const { inbox, deleteInboxItem } = useLoreGraph();
  const [convertItem, setConvertItem] = useState<InboxItem | null>(null);
  const pending = inbox.filter(i => i.status === 'pending');

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(23, 23, 23, 0.35)', backdropFilter: 'blur(3px)' }} />
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col shadow-2xl"
        style={{
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
        }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b flex-shrink-0" style={{ borderColor: 'var(--border-light)' }}>
          <div>
            <h2 className="font-serif text-2xl font-normal" style={{ color: 'var(--text-primary)' }}>
              Fragments
            </h2>
            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {pending.length} unattached thoughts
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#ECE8DF] transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* List of fragments */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-12">
              <p className="font-serif italic text-base" style={{ color: 'var(--text-secondary)' }}>
                No fragments in the wings.
              </p>
              <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                Use Quick Thought to capture ideas on the fly.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded border transition-colors group"
                  style={{ borderColor: 'var(--border-light)', background: 'var(--bg)' }}
                >
                  <p className="font-serif text-base italic leading-relaxed mb-3" style={{ color: 'var(--text-primary)' }}>
                    &ldquo;{item.content}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t text-xs font-mono" style={{ borderColor: 'var(--border-light)', color: 'var(--text-tertiary)' }}>
                    <span>{formatRelativeTime(item.createdAt)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setConvertItem(item)}
                        className="flex items-center gap-1 hover:underline text-[#8A4938]"
                      >
                        <Plus size={11} />
                        <span>Convert</span>
                      </button>
                      <button
                        onClick={() => deleteInboxItem(item.id)}
                        className="hover:text-red-700 transition-colors"
                        title="Delete fragment"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {convertItem && (
        <ConvertInboxModal
          item={convertItem}
          onClose={() => setConvertItem(null)}
        />
      )}
    </>
  );
}

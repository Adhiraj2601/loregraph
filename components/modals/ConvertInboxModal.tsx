'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { useLoreGraph } from '@/lib/context';
import { InboxItem } from '@/types/inbox';
import { useRouter } from 'next/navigation';

interface ConvertInboxModalProps {
  item: InboxItem;
  onClose: () => void;
}

export function ConvertInboxModal({ item, onClose }: ConvertInboxModalProps) {
  const { ideas, createIdea, createNode, updateInboxItem } = useLoreGraph();
  const [mode, setMode] = useState<'idea' | 'node' | null>(null);
  const [selectedIdeaId, setSelectedIdeaId] = useState('');
  const router = useRouter();

  const handleConvertToIdea = () => {
    const title = item.content.slice(0, 50).trim();
    const idea = createIdea({ title, description: item.content, tags: [] });
    createNode({
      ideaId: idea.id,
      title,
      description: item.content,
      type: 'ROOT',
      tags: [],
      position: { x: 380, y: 260 },
      isRoot: true,
    });
    updateInboxItem(item.id, { status: 'converted' });
    onClose();
    router.push(`/ideas/${idea.id}`);
  };

  const handleConvertToNode = () => {
    if (!selectedIdeaId) return;
    const title = item.content.slice(0, 45).trim();
    createNode({
      ideaId: selectedIdeaId,
      title,
      description: item.content,
      type: 'CONCEPT',
      tags: [],
      position: { x: 350 + (Math.random() * 160 - 80), y: 220 + (Math.random() * 160 - 80) },
    });
    updateInboxItem(item.id, { status: 'converted' });
    onClose();
    router.push(`/ideas/${selectedIdeaId}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(23, 23, 23, 0.45)', backdropFilter: 'blur(4px)' }} />

        <motion.div
          className="relative w-full max-w-md rounded-lg overflow-hidden shadow-2xl p-6 sm:p-7"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl font-normal" style={{ color: 'var(--text-primary)' }}>
              Convert Fragment
            </h2>
            <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}><X size={15} /></button>
          </div>

          <div className="space-y-4">
            <p className="font-serif italic text-sm p-3 rounded" style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
              &ldquo;{item.content}&rdquo;
            </p>

            {!mode && (
              <div className="space-y-2">
                <button
                  onClick={() => setMode('idea')}
                  className="w-full p-3.5 rounded text-left transition-colors hover:bg-[#ECE8DF] border"
                  style={{ borderColor: 'var(--border-light)', background: 'var(--surface)' }}
                >
                  <div className="font-serif text-base font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    Create a New World
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    Begin an entire universe around this fragment
                  </div>
                </button>

                <button
                  onClick={() => setMode('node')}
                  className="w-full p-3.5 rounded text-left transition-colors hover:bg-[#ECE8DF] border"
                  style={{ borderColor: 'var(--border-light)', background: 'var(--surface)' }}
                >
                  <div className="font-serif text-base font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    Attach as Idea to an Existing World
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    Add this fragment into an active archive
                  </div>
                </button>
              </div>
            )}

            {mode === 'idea' && (
              <div className="space-y-4 pt-2">
                <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                  This will generate a new World and place this fragment as its root foundation.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setMode(null)} className="flex-1 py-2 rounded text-xs font-medium hover:bg-[#ECE8DF]" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    Back
                  </button>
                  <button onClick={handleConvertToIdea} className="flex-1 py-2 rounded text-xs font-medium" style={{ background: 'var(--accent-rust)', color: '#FCFAF7' }}>
                    Create World
                  </button>
                </div>
              </div>
            )}

            {mode === 'node' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Select Destination World
                  </label>
                  <select
                    value={selectedIdeaId}
                    onChange={e => setSelectedIdeaId(e.target.value)}
                    className="w-full px-3 py-2 rounded text-sm font-serif outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="">Choose a world...</option>
                    {ideas.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setMode(null)} className="flex-1 py-2 rounded text-xs font-medium hover:bg-[#ECE8DF]" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    Back
                  </button>
                  <button onClick={handleConvertToNode} disabled={!selectedIdeaId} className="flex-1 py-2 rounded text-xs font-medium disabled:opacity-40" style={{ background: 'var(--accent-rust)', color: '#FCFAF7' }}>
                    Attach Idea
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

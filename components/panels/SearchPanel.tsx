'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ArrowUpRight } from 'lucide-react';
import { useLoreGraph } from '@/lib/context';
import { nodeRepo } from '@/lib/storage/repository';
import { NODE_TYPE_CONFIG } from '@/lib/nodeTypes';
import { useRouter } from 'next/navigation';

interface SearchPanelProps {
  onClose: () => void;
}

interface SearchResult {
  type: 'idea' | 'node';
  id: string;
  title: string;
  subtitle: string;
  ideaId?: string;
  ideaTitle?: string;
  nodeType?: string;
  tags?: string[];
}

export function SearchPanel({ onClose }: SearchPanelProps) {
  const { ideas } = useLoreGraph();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setSelectedIdx(0); return; }
    const q = query.toLowerCase();
    const found: SearchResult[] = [];

    for (const idea of ideas) {
      const matches =
        idea.title.toLowerCase().includes(q) ||
        idea.description.toLowerCase().includes(q) ||
        idea.tags.some(t => t.toLowerCase().includes(q));
      if (matches) {
        const nodeCount = nodeRepo.getAllByIdeaId(idea.id).length;
        found.push({
          type: 'idea',
          id: idea.id,
          title: idea.title,
          subtitle: `${nodeCount} ideas · ${idea.tags.slice(0, 3).join(', ')}`,
          tags: idea.tags,
        });
      }

      const nodes = nodeRepo.getAllByIdeaId(idea.id);
      for (const node of nodes) {
        const nodeMatches =
          node.title.toLowerCase().includes(q) ||
          node.description.toLowerCase().includes(q) ||
          node.tags.some(t => t.toLowerCase().includes(q)) ||
          node.type.toLowerCase().includes(q);
        if (nodeMatches) {
          found.push({
            type: 'node',
            id: node.id,
            ideaId: idea.id,
            ideaTitle: idea.title,
            title: node.title,
            subtitle: idea.title,
            nodeType: node.type,
            tags: node.tags,
          });
        }
      }
    }

    setResults(found.slice(0, 12));
    setSelectedIdx(0);
  }, [query, ideas]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'idea') {
      router.push(`/ideas/${result.id}`);
    } else {
      router.push(`/ideas/${result.ideaId}?node=${result.id}`);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIdx]) { handleSelect(results[selectedIdx]); }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(23, 23, 23, 0.4)', backdropFilter: 'blur(4px)' }} />

        <motion.div
          className="relative w-full max-w-xl rounded-lg overflow-hidden shadow-2xl"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          onClick={e => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Input Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <Search size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search across all worlds, characters, and fragments..."
              className="flex-1 bg-transparent font-serif text-lg outline-none placeholder:italic"
              style={{ color: 'var(--text-primary)' }}
            />
            <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
              <X size={15} />
            </button>
          </div>

          {/* Results List */}
          {results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto py-2 divide-y" style={{ borderColor: 'var(--border-light)' }}>
              {results.map((r, i) => {
                const conf = r.nodeType ? NODE_TYPE_CONFIG[r.nodeType as keyof typeof NODE_TYPE_CONFIG] : null;
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors"
                    style={{ background: i === selectedIdx ? 'var(--bg-subtle)' : 'transparent' }}
                    onClick={() => handleSelect(r)}
                    onMouseEnter={() => setSelectedIdx(i)}
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        {r.type === 'idea' ? (
                          <span className="text-xs" style={{ color: 'var(--accent-rust)' }}>✻</span>
                        ) : conf ? (
                          <span style={{ color: conf.color, fontSize: '11px' }}>{conf.symbol}</span>
                        ) : null}
                        <span className="font-serif text-base font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {r.title}
                        </span>
                      </div>
                      <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {r.type === 'node' && <span style={{ color: 'var(--accent-rust)' }}>{conf?.label || r.nodeType} in </span>}
                        {r.subtitle}
                      </div>
                    </div>
                    <ArrowUpRight size={14} style={{ color: 'var(--accent-rust)', opacity: i === selectedIdx ? 1 : 0.4 }} />
                  </button>
                );
              })}
            </div>
          ) : query ? (
            <div className="px-5 py-8 text-center">
              <p className="font-serif italic text-sm" style={{ color: 'var(--text-secondary)' }}>
                No records found for &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : (
            <div className="px-5 py-5 text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
              <p className="uppercase tracking-widest text-[10px] mb-2">Archive Search</p>
              <p>Type to search across worlds, abilities, characters, and descriptions.</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t px-5 py-2 flex items-center justify-between text-[11px] font-mono" style={{ borderColor: 'var(--border-light)', color: 'var(--text-tertiary)' }}>
            <span>{results.length} results</span>
            <span>↑↓ navigate · ↵ open</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

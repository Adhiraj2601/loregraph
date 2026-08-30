'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Idea } from '@/types/idea';
import { formatRelativeTime } from '@/lib/utils';
import { nodeRepo } from '@/lib/storage/repository';
import { ArrowRight, Circle } from 'lucide-react';

interface IdeaCardProps {
  idea: Idea;
}

const COVER_COLORS: Record<string, string> = {
  '#7C3A2D': 'rgba(124,58,45,0.15)',
  '#2D3A5C': 'rgba(45,58,92,0.15)',
  '#3A2D5C': 'rgba(58,45,92,0.15)',
  '#1A3A4A': 'rgba(26,58,74,0.15)',
  '#2A2A3A': 'rgba(42,42,58,0.15)',
};

export function IdeaCard({ idea }: IdeaCardProps) {
  const router = useRouter();
  const nodes = nodeRepo.getAllByIdeaId(idea.id);
  const nodeCount = nodes.length;
  const bgColor = idea.coverColor ? COVER_COLORS[idea.coverColor] ?? 'rgba(39,44,54,0.2)' : 'rgba(39,44,54,0.2)';
  const accentColor = idea.coverColor ?? '#272C36';

  return (
    <motion.div
      className="group relative cursor-pointer rounded-lg overflow-hidden"
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
      }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={() => router.push(`/ideas/${idea.id}`)}
      tabIndex={0}
      role="button"
      aria-label={`Open ${idea.title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/ideas/${idea.id}`); }}
    >
      {/* Color stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-px transition-all duration-300 group-hover:h-0.5"
        style={{ background: accentColor, opacity: 0.6 }}
      />

      {/* Border glow on hover */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px ${accentColor}55` }}
      />

      {/* Cover tint */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
        style={{ background: accentColor }}
      />

      <div className="relative p-5">
        {/* Title */}
        <h3
          className="text-sm font-semibold mb-2 uppercase tracking-wider leading-snug"
          style={{ color: 'var(--text)', letterSpacing: '0.1em' }}
        >
          {idea.title}
        </h3>

        {/* Description */}
        <p
          className="text-sm leading-relaxed mb-4 line-clamp-3"
          style={{ color: 'var(--text2)' }}
        >
          {idea.description}
        </p>

        {/* Tags */}
        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {idea.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded uppercase tracking-wider"
                style={{
                  background: 'rgba(150,155,167,0.08)',
                  border: '1px solid rgba(150,155,167,0.15)',
                  color: 'var(--text2)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--text2)', fontFamily: 'JetBrains Mono, monospace' }}
            >
              <Circle size={6} fill="currentColor" />
              {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
            </span>
            <span
              className="text-xs"
              style={{ color: 'var(--text2)', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {formatRelativeTime(idea.updatedAt)}
            </span>
          </div>

          <span
            className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ color: 'var(--accent)' }}
          >
            Open <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

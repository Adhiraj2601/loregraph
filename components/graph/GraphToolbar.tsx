'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, Plus, Eye, Edit3, Maximize2, RotateCcw, Clock } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

interface GraphToolbarProps {
  ideaTitle: string;
  ideaDescription?: string;
  ideaId: string;
  nodeCount: number;
  edgeCount: number;
  isExploreMode: boolean;
  isTimelineOpen?: boolean;
  onToggleExplore: () => void;
  onToggleTimeline?: () => void;
  onCreateNode: () => void;
  onDeleteIdea?: () => void;
  updatedAt: string;
}

export function GraphToolbar({
  ideaTitle,
  ideaDescription,
  ideaId,
  nodeCount,
  edgeCount,
  isExploreMode,
  isTimelineOpen = false,
  onToggleExplore,
  onToggleTimeline,
  onCreateNode,
  onDeleteIdea,
}: GraphToolbarProps) {
  const { fitView, setViewport } = useReactFlow();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        setMenuOpen(false);
        setConfirmingDelete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Top Editorial Header Bar */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between px-6 sm:px-10 py-5 transition-all"
        style={{
          background: 'linear-gradient(to bottom, rgba(244, 241, 234, 0.95) 70%, rgba(244, 241, 234, 0))',
          pointerEvents: 'none',
        }}
      >
        {/* Left: Back & Title */}
        <div className="pointer-events-auto space-y-1 max-w-xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono transition-colors hover:text-black mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={12} />
            <span>Index</span>
          </Link>

          <div>
            <h1
              className="font-serif text-2xl sm:text-3xl font-medium tracking-tight leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {ideaTitle}
            </h1>
            {ideaDescription && (
              <p
                className="text-xs sm:text-sm font-serif italic max-w-lg mt-0.5 line-clamp-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {ideaDescription}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="pointer-events-auto flex items-center gap-3 pt-1">
          {/* Quick Add Node */}
          {!isExploreMode && (
            <button
              onClick={onCreateNode}
              className="px-3 py-1.5 rounded text-xs font-medium transition-all hover:bg-[#ECE8DF] flex items-center gap-1.5"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--accent-rust)',
              }}
              title="Add idea branch (N)"
            >
              <Plus size={12} />
              <span>Add Idea</span>
            </button>
          )}

          {/* Explore Toggle */}
          <button
            onClick={onToggleExplore}
            className="px-3 py-1.5 rounded text-xs font-medium transition-all hover:bg-[#ECE8DF] flex items-center gap-1.5"
            style={{
              background: isExploreMode ? 'rgba(138, 73, 56, 0.1)' : 'var(--surface)',
              border: `1px solid ${isExploreMode ? 'var(--accent-rust)' : 'var(--border)'}`,
              color: isExploreMode ? 'var(--accent-rust)' : 'var(--text-secondary)',
            }}
            title="Toggle explore mode (Space)"
          >
            {isExploreMode ? <Eye size={12} /> : <Edit3 size={12} />}
            <span className="hidden sm:inline">{isExploreMode ? 'Exploring' : 'Editing'}</span>
          </button>

          {/* Timeline Drawer Toggle */}
          {onToggleTimeline && (
            <button
              onClick={onToggleTimeline}
              className="px-3 py-1.5 rounded text-xs font-medium transition-all hover:bg-[#ECE8DF] flex items-center gap-1.5"
              style={{
                background: isTimelineOpen ? 'rgba(138, 73, 56, 0.1)' : 'var(--surface)',
                border: `1px solid ${isTimelineOpen ? 'var(--accent-rust)' : 'var(--border)'}`,
                color: isTimelineOpen ? 'var(--accent-rust)' : 'var(--text-secondary)',
              }}
              title="Toggle Timeline & Epochs (T)"
            >
              <Clock size={12} />
              <span className="hidden sm:inline">Timeline</span>
            </button>
          )}

          {/* Discreet Overflow Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded flex items-center justify-center transition-colors hover:bg-[#ECE8DF]"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
              aria-label="More options"
            >
              <MoreHorizontal size={15} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-10 w-44 rounded-md shadow-lg py-1.5 z-30 animate-editorial-fade"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <button
                  onClick={() => {
                    fitView({ padding: 0.2, duration: 400 });
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-[#ECE8DF] transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Maximize2 size={13} style={{ color: 'var(--text-secondary)' }} />
                  <span>Fit to Screen (F)</span>
                </button>
                <button
                  onClick={() => {
                    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 });
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-[#ECE8DF] transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <RotateCcw size={13} style={{ color: 'var(--text-secondary)' }} />
                  <span>Reset Camera</span>
                </button>

                {onDeleteIdea && (
                  <>
                    <div className="my-1 border-t" style={{ borderColor: 'var(--border-light)' }} />
                    {confirmingDelete ? (
                      <button
                        onClick={() => {
                          onDeleteIdea();
                          setMenuOpen(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs font-mono transition-colors text-white bg-[#9B3D3D] rounded-sm"
                      >
                        Confirm Delete World
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmingDelete(true)}
                        className="w-full px-3 py-1.5 text-left text-xs font-mono transition-colors text-[#9B3D3D] hover:bg-red-50"
                      >
                        Delete this World...
                      </button>
                    )}
                  </>
                )}

                <div className="my-1 border-t" style={{ borderColor: 'var(--border-light)' }} />
                <div className="px-3 py-1 text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  {nodeCount} ideas · {edgeCount} links
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Discreet bottom left info badge */}
      <div
        className="absolute bottom-5 left-6 z-10 hidden sm:flex items-center gap-3 text-[11px] font-mono"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <span>{nodeCount} branches</span>
        <span>·</span>
        <span>Space: Explore</span>
        <span>·</span>
        <span>N: New Idea</span>
      </div>
    </>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLoreGraph } from '@/lib/context';
import { QuickIdeaModal } from '@/components/modals/QuickIdeaModal';
import { SearchPanel } from '@/components/panels/SearchPanel';
import { InboxPanel } from '@/components/panels/InboxPanel';
import { KeyboardShortcutsModal } from '@/components/modals/KeyboardShortcutsModal';

export function Navigation() {
  const pathname = usePathname();
  const { inbox, setIsSearchOpen, isSearchOpen, isInboxOpen, setIsInboxOpen, isQuickIdeaOpen, setIsQuickIdeaOpen } = useLoreGraph();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const pendingCount = inbox.filter(i => i.status === 'pending').length;

  // Global key listener for '/' and '?'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-6 sm:px-10 transition-colors"
        style={{
          background: 'rgba(244, 241, 234, 0.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Left: Brand */}
        <div className="flex items-baseline gap-3">
          <Link
            href="/"
            className="text-base tracking-tight font-medium hover:opacity-75 transition-opacity"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            LOREGRAPH
          </Link>
          <span
            className="hidden md:inline text-xs italic font-serif"
            style={{ color: 'var(--text-secondary)' }}
          >
            Personal Archive
          </span>
        </div>

        {/* Right: Minimal Nav Actions */}
        <div className="flex items-center gap-5 sm:gap-7 text-xs font-medium">
          {/* Index Link (active state) */}
          <Link
            href="/"
            className="transition-colors hover:text-black hidden sm:inline"
            style={{
              color: pathname === '/' ? 'var(--text-primary)' : 'var(--text-secondary)',
              textDecoration: pathname === '/' ? 'underline' : 'none',
              textUnderlineOffset: '4px',
            }}
          >
            Index
          </Link>

          {/* Universe View */}
          <Link
            href="/universe"
            className="transition-colors hover:text-black"
            style={{
              color: pathname === '/universe' ? 'var(--text-primary)' : 'var(--text-secondary)',
              textDecoration: pathname === '/universe' ? 'underline' : 'none',
              textUnderlineOffset: '4px',
            }}
          >
            Universe
          </Link>

          {/* Quick Thought Action */}
          <button
            onClick={() => setIsQuickIdeaOpen(true)}
            className="transition-colors hover:text-black flex items-center gap-1"
            style={{ color: 'var(--accent-rust)' }}
          >
            <span>+ Quick Thought</span>
          </button>

          {/* Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="transition-colors hover:text-black flex items-center gap-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>Search</span>
            <span
              className="text-[10px] font-mono px-1 py-0.5 rounded"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-tertiary)' }}
            >
              /
            </span>
          </button>

          {/* Inbox / Fragments */}
          <button
            onClick={() => setIsInboxOpen(true)}
            className="transition-colors hover:text-black flex items-center gap-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>Fragments</span>
            {pendingCount > 0 && (
              <span
                className="font-mono text-[10px] px-1.5 py-0.2 rounded-full"
                style={{ background: 'var(--accent-rust)', color: '#FCFAF7' }}
              >
                {pendingCount}
              </span>
            )}
          </button>

          {/* Shortcuts Info */}
          <button
            onClick={() => setShortcutsOpen(true)}
            className="hidden lg:inline text-[11px] font-mono hover:text-black"
            style={{ color: 'var(--text-tertiary)' }}
            title="Shortcuts (?)"
          >
            ?
          </button>
        </div>
      </nav>

      {/* Modals & Drawers */}
      {isSearchOpen && <SearchPanel onClose={() => setIsSearchOpen(false)} />}
      {isInboxOpen && <InboxPanel onClose={() => setIsInboxOpen(false)} />}
      {isQuickIdeaOpen && <QuickIdeaModal onClose={() => setIsQuickIdeaOpen(false)} />}
      {shortcutsOpen && <KeyboardShortcutsModal onClose={() => setShortcutsOpen(false)} />}
    </>
  );
}

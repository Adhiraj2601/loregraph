'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLoreGraph } from '@/lib/context';
import { User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { QuickIdeaModal } from '@/components/modals/QuickIdeaModal';
import { SearchPanel } from '@/components/panels/SearchPanel';
import { InboxPanel } from '@/components/panels/InboxPanel';
import { KeyboardShortcutsModal } from '@/components/modals/KeyboardShortcutsModal';

export function Navigation() {
  const pathname = usePathname();
  const { inbox, setIsSearchOpen, isSearchOpen, isInboxOpen, setIsInboxOpen, isQuickIdeaOpen, setIsQuickIdeaOpen } = useLoreGraph();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pendingCount = inbox.filter(i => i.status === 'pending').length;

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Worldbuilder';
  const displayEmail = profile?.email || user?.email || '';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;

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
            className="font-zeyada aakhyana-gradient-text text-2xl font-bold tracking-normal hover:opacity-85 transition-opacity"
          >
            Aakhyana
          </Link>
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

          {/* User Auth Section */}
          <div className="relative pl-1 border-l" style={{ borderColor: 'var(--border-light)' }}>
            {authLoading ? (
              <div className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                  title={displayName}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-7 h-7 rounded-full object-cover border"
                      style={{ borderColor: 'var(--border)' }}
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-serif font-bold text-white"
                      style={{ background: 'var(--accent-rust)' }}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline text-xs font-serif max-w-[100px] truncate" style={{ color: 'var(--text-primary)' }}>
                    {displayName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[var(--text-tertiary)]" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div
                      className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50 py-1.5 text-xs font-serif"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                        <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {displayName}
                        </p>
                        <p className="font-mono text-[10px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                          {displayEmail}
                        </p>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-subtle)] transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <UserIcon className="w-3.5 h-3.5" style={{ color: 'var(--accent-rust)' }} />
                        <span>Profile & Settings</span>
                      </Link>

                      <button
                        onClick={async () => {
                          setUserMenuOpen(false);
                          await signOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                        style={{ color: 'var(--accent-rust)' }}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-serif font-medium transition-all hover:bg-[var(--accent-rust)] hover:text-white"
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  background: 'var(--surface)',
                }}
              >
                <span>Sign In</span>
              </Link>
            )}
          </div>
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

'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, User as UserIcon, Calendar, ShieldCheck, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navigation } from '@/components/ui/Navigation';
import { formatRelativeTime } from '@/lib/utils';

function ProfileContent() {
  const router = useRouter();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Worldbuilder';
  const displayEmail = profile?.email || user?.email || 'No email on record';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header breadcrumb */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)] hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Archive</span>
        </Link>
      </div>

      <div
        className="rounded-xl overflow-hidden p-8 sm:p-10"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Top: Avatar & Primary info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b" style={{ borderColor: 'var(--border-light)' }}>
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover border-2 shadow-sm"
                style={{ borderColor: 'var(--accent-rust)' }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center font-serif text-2xl font-semibold border-2"
                style={{
                  background: 'var(--bg-subtle)',
                  borderColor: 'var(--border)',
                  color: 'var(--accent-rust)',
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-medium" style={{ color: 'var(--text-primary)' }}>
                  {displayName}
                </h1>
                <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {displayEmail}
                </p>
              </div>

              <div className="flex items-center justify-center sm:justify-end gap-2 pt-2 sm:pt-0">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh profile data from Supabase"
                  className="p-2 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-black transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer hover:bg-[rgba(138,73,56,0.1)]"
                  style={{
                    color: 'var(--accent-rust)',
                    border: '1px solid rgba(138, 73, 56, 0.3)',
                  }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile metadata fields */}
        <div className="pt-8 space-y-5">
          <h2 className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.15em' }}>
            Account & Security Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className="p-4 rounded-lg"
              style={{ background: 'var(--bg)', border: '1px solid var(--border-light)' }}
            >
              <div className="flex items-center gap-2 text-xs font-mono mb-1" style={{ color: 'var(--text-tertiary)' }}>
                <Mail className="w-3.5 h-3.5" />
                <span>Email Address</span>
              </div>
              <p className="font-mono text-sm break-all" style={{ color: 'var(--text-primary)' }}>
                {displayEmail}
              </p>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{ background: 'var(--bg)', border: '1px solid var(--border-light)' }}
            >
              <div className="flex items-center gap-2 text-xs font-mono mb-1" style={{ color: 'var(--text-tertiary)' }}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Auth Provider</span>
              </div>
              <p className="font-mono text-sm capitalize" style={{ color: 'var(--text-primary)' }}>
                {user?.app_metadata?.provider || 'Google OAuth'}
              </p>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{ background: 'var(--bg)', border: '1px solid var(--border-light)' }}
            >
              <div className="flex items-center gap-2 text-xs font-mono mb-1" style={{ color: 'var(--text-tertiary)' }}>
                <UserIcon className="w-3.5 h-3.5" />
                <span>User Identifier</span>
              </div>
              <p className="font-mono text-xs truncate" title={user?.id} style={{ color: 'var(--text-secondary)' }}>
                {user?.id}
              </p>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{ background: 'var(--bg)', border: '1px solid var(--border-light)' }}
            >
              <div className="flex items-center gap-2 text-xs font-mono mb-1" style={{ color: 'var(--text-tertiary)' }}>
                <Calendar className="w-3.5 h-3.5" />
                <span>Account Created</span>
              </div>
              <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : user?.created_at
                  ? new Date(user.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Recent'}
              </p>
            </div>
          </div>
        </div>

        {/* Database RLS status banner */}
        <div
          className="mt-8 p-4 rounded-lg flex items-center justify-between text-xs"
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-serif italic text-[var(--text-secondary)]">
              Row Level Security Active — User profile isolated to {displayEmail}
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase text-[var(--text-tertiary)]">
            Supabase Protected
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <ProtectedRoute>
        <main className="pt-28 pb-24 px-6 sm:px-10">
          <ProfileContent />
        </main>
      </ProtectedRoute>
    </div>
  );
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/ui/Navigation';

import { GoogleIcon } from '@/components/auth/GoogleIcon';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();

  const nextUrl = searchParams.get('next') || '/';
  const queryError = searchParams.get('error');

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(queryError);

  useEffect(() => {
    if (queryError) {
      setErrorMessage(queryError);
    }
  }, [queryError]);

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(nextUrl);
    }
  }, [user, authLoading, nextUrl, router]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);

    const { error } = await signInWithGoogle(nextUrl);

    if (error) {
      setIsSigningIn(false);
      setErrorMessage(error.message || 'Failed to initialize Google login');
    }
    // If successful, user is redirected by Supabase to Google consent screen
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className="p-8 sm:p-10 rounded-xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="text-center mb-8">
          <Link
            href="/"
            className="font-zeyada aakhyana-gradient-text text-4xl font-bold tracking-normal inline-block mb-3"
          >
            Aakhyana
          </Link>
          <h1 className="font-serif text-2xl font-medium tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            Welcome Back
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
            Personal Worldbuilding Archive
          </p>
        </div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3.5 rounded-lg flex items-start gap-3 text-xs leading-relaxed"
            style={{
              background: 'rgba(180, 70, 70, 0.08)',
              border: '1px solid rgba(180, 70, 70, 0.25)',
              color: '#8A3232',
            }}
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-medium">Sign-in Notice: </span>
              {errorMessage}
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn || authLoading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-md active:scale-[0.99]"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              color: '#2D2825',
            }}
          >
            {isSigningIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-rust)]" />
                <span>Redirecting to Google...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: 'var(--border-light)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            Authenticate to sync your notebooks, lore fragments, and world graphs securely with Supabase.
          </p>
        </div>
      </div>

      <div className="text-center mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)] hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Index</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-28 pb-20 px-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Suspense
          fallback={
            <div className="text-center p-8">
              <div className="w-6 h-6 border-2 border-[var(--accent-rust)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="font-serif italic text-xs text-[var(--text-secondary)]">Loading sign in...</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}

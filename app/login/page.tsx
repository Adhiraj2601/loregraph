'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/ui/Navigation';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

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

'use client';

import { supabase } from '@/lib/supabase';

const BUCKET = 'world-maps';
const localKey = (ideaId: string) => `loregraph:map:${ideaId}`;

// ─── Upload map image to Supabase Storage ─────────────────────────────────────

export async function uploadWorldMap(ideaId: string, file: File): Promise<string | null> {
  // Build a deterministic path so re-uploads replace the previous file
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${ideaId}/map.${ext}`;

  if (!supabase) {
    // Fallback: store as an object URL in sessionStorage only
    const localUrl = URL.createObjectURL(file);
    sessionStorage.setItem(localKey(ideaId), localUrl);
    return localUrl;
  }

  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (error) {
      console.error('Map upload error:', error.message);
      // Fallback to session URL so the user isn't blocked
      const localUrl = URL.createObjectURL(file);
      sessionStorage.setItem(localKey(ideaId), localUrl);
      return localUrl;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = data.publicUrl;

    // Cache locally so we don't hit the network on every page load
    localStorage.setItem(localKey(ideaId), publicUrl);
    return publicUrl;
  } catch (err) {
    console.error('Map upload exception:', err);
    return null;
  }
}

// ─── Load map URL (local cache first, then Supabase) ─────────────────────────

export async function loadWorldMap(ideaId: string): Promise<string | null> {
  // 1. Try localStorage cache first (instant)
  const cached = localStorage.getItem(localKey(ideaId));
  if (cached) return cached;

  // 2. Try sessionStorage (blob URLs from when Supabase isn't configured)
  const session = sessionStorage.getItem(localKey(ideaId));
  if (session) return session;

  // 3. Fall back to constructing the Supabase public URL directly
  if (!supabase) return null;
  try {
    // Try both .png and .jpg since we don't know the extension
    for (const ext of ['png', 'jpg', 'jpeg', 'svg', 'webp']) {
      const path = `${ideaId}/map.${ext}`;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      // Check if it actually exists via HEAD request
      const res = await fetch(data.publicUrl, { method: 'HEAD' });
      if (res.ok) {
        localStorage.setItem(localKey(ideaId), data.publicUrl);
        return data.publicUrl;
      }
    }
  } catch (err) {
    console.error('Map load error:', err);
  }

  return null;
}

// ─── Remove map from storage + local caches ──────────────────────────────────

export async function removeWorldMap(ideaId: string): Promise<void> {
  localStorage.removeItem(localKey(ideaId));
  sessionStorage.removeItem(localKey(ideaId));

  if (!supabase) return;
  try {
    // Attempt to delete all known extensions
    const paths = ['png', 'jpg', 'jpeg', 'svg', 'webp'].map(ext => `${ideaId}/map.${ext}`);
    await supabase.storage.from(BUCKET).remove(paths);
  } catch (err) {
    console.error('Map remove error:', err);
  }
}

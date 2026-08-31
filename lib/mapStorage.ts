'use client';

import { supabase } from '@/lib/supabase';

const BUCKET = 'world-maps';
const localKey = (ideaId: string) => `loregraph:map:${ideaId}`;

// ─── Upload map image to Supabase Storage ─────────────────────────────────────

export async function uploadWorldMap(ideaId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${ideaId}/map.${ext}`;

  if (!supabase) {
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
      const localUrl = URL.createObjectURL(file);
      sessionStorage.setItem(localKey(ideaId), localUrl);
      return localUrl;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = data.publicUrl;

    localStorage.setItem(localKey(ideaId), publicUrl);
    return publicUrl;
  } catch (err) {
    console.error('Map upload exception:', err);
    return null;
  }
}

// ─── Load map URL (local cache first, then Supabase Storage list) ──────────────

export async function loadWorldMap(ideaId: string): Promise<string | null> {
  // 1. Try localStorage cache first (instant)
  const cached = localStorage.getItem(localKey(ideaId));
  if (cached) return cached;

  // 2. Try sessionStorage (fallback for non-supabase runs)
  const session = sessionStorage.getItem(localKey(ideaId));
  if (session) return session;

  // 3. Query Supabase Storage via official SDK listing (avoids browser CORS issues)
  if (!supabase) return null;
  try {
    const { data: files, error } = await supabase.storage.from(BUCKET).list(ideaId);
    if (!error && files && files.length > 0) {
      const mapFile = files.find(f => f.name.startsWith('map.'));
      if (mapFile) {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${ideaId}/${mapFile.name}`);
        if (data?.publicUrl) {
          localStorage.setItem(localKey(ideaId), data.publicUrl);
          return data.publicUrl;
        }
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
    const { data: files } = await supabase.storage.from(BUCKET).list(ideaId);
    if (files && files.length > 0) {
      const paths = files.map(f => `${ideaId}/${f.name}`);
      await supabase.storage.from(BUCKET).remove(paths);
    }
  } catch (err) {
    console.error('Map remove error:', err);
  }
}

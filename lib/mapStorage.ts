'use client';

import { supabase } from '@/lib/supabase';
import { readFileAsDataUrl } from '@/lib/imageStorage';

const BUCKET = 'world-maps';
const localKey = (ideaId: string) => `loregraph:map:${ideaId}`;

// ─── Upload map image with guaranteed persistent fallback ─────────────────────

export async function uploadWorldMap(ideaId: string, file: File): Promise<string | null> {
  // 1. Convert to base64 Data URL so it permanently survives reloads & offline
  let dataUrl: string | null = null;
  try {
    dataUrl = await readFileAsDataUrl(file);
    localStorage.setItem(localKey(ideaId), dataUrl);
  } catch (e) {
    console.warn('Failed to encode map as data URL:', e);
  }

  if (!supabase) {
    return dataUrl;
  }

  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `${ideaId}/map.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (error) {
      console.warn('Map upload error (using local persistent Data URL):', error.message);
      return dataUrl;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = data.publicUrl;

    if (publicUrl) {
      localStorage.setItem(localKey(ideaId), publicUrl);
      return publicUrl;
    }

    return dataUrl;
  } catch (err) {
    console.error('Map upload exception (using local Data URL):', err);
    return dataUrl;
  }
}

// ─── Load map URL (localStorage persistent cache + Supabase SDK) ──────────────

export async function loadWorldMap(ideaId: string): Promise<string | null> {
  // 1. Check localStorage cache
  const cached = localStorage.getItem(localKey(ideaId));
  if (cached) {
    // If it's a dead session blob URL, ignore it; otherwise data URL or public URL is valid
    if (!cached.startsWith('blob:')) {
      return cached;
    }
  }

  // 2. Query Supabase Storage directly
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
  localStorage.removeItem(settingsKey(ideaId));
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

// ─── Map Display Settings (Scale, Opacity, Position, Fixed Mode) ───────────────

const settingsKey = (ideaId: string) => `loregraph:map_settings:${ideaId}`;

export interface WorldMapSettings {
  opacity: number;
  scale: number;
  position: { x: number; y: number };
  isFixed: boolean;
}

export const DEFAULT_MAP_SETTINGS: WorldMapSettings = {
  opacity: 0.5,
  scale: 1,
  position: { x: 0, y: 0 },
  isFixed: true, // Default to true so nodes do NOT stick to the map
};

export function loadMapSettings(ideaId: string): WorldMapSettings {
  try {
    const raw = localStorage.getItem(settingsKey(ideaId));
    if (raw) return { ...DEFAULT_MAP_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_MAP_SETTINGS;
}

export function saveMapSettings(ideaId: string, settings: Partial<WorldMapSettings>): void {
  try {
    const current = loadMapSettings(ideaId);
    const updated = { ...current, ...settings };
    localStorage.setItem(settingsKey(ideaId), JSON.stringify(updated));
  } catch {}
}

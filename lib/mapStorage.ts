'use client';

import { supabase } from '@/lib/supabase';
import { readFileAsDataUrl } from '@/lib/imageStorage';
import { idbGet, idbSet, idbDelete } from '@/lib/idbStorage';
import { nodeRepo } from '@/lib/storage/repository';

const BUCKET = 'world-maps';
const localKey = (ideaId: string) => `loregraph:map:${ideaId}`;
const idbKey = (ideaId: string) => `map:${ideaId}`;

// ─── Upload map image with guaranteed persistent multi-layer storage ──────────

export async function uploadWorldMap(ideaId: string, file: File): Promise<string | null> {
  let dataUrl: string | null = null;
  try {
    dataUrl = await readFileAsDataUrl(file);
    // 1. Save to IndexedDB (unlimited quota, permanent across deployments)
    await idbSet(idbKey(ideaId), dataUrl);
    // 2. Save to localStorage (if small enough)
    try {
      localStorage.setItem(localKey(ideaId), dataUrl);
    } catch {}
    // 3. Save to ROOT node so it syncs with Supabase database
    const rootNode = nodeRepo.getAllByIdeaId(ideaId).find(n => n.isRoot);
    if (rootNode) {
      nodeRepo.update(rootNode.id, { imageUrl: dataUrl });
    }
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
      console.warn('Map upload error (using local persistent IndexedDB storage):', error.message);
      return dataUrl;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = data.publicUrl;

    if (publicUrl) {
      await idbSet(idbKey(ideaId), publicUrl);
      try {
        localStorage.setItem(localKey(ideaId), publicUrl);
      } catch {}
      const rootNode = nodeRepo.getAllByIdeaId(ideaId).find(n => n.isRoot);
      if (rootNode) {
        nodeRepo.update(rootNode.id, { imageUrl: publicUrl });
      }
      return publicUrl;
    }

    return dataUrl;
  } catch (err) {
    console.error('Map upload exception (using local Data URL):', err);
    return dataUrl;
  }
}

// ─── Load map URL (IndexedDB -> localStorage -> ROOT node -> Supabase Storage) ─

export async function loadWorldMap(ideaId: string): Promise<string | null> {
  // 1. Check IndexedDB (primary local storage, permanent across deployments)
  const idbCached = await idbGet<string>(idbKey(ideaId));
  if (idbCached && !idbCached.startsWith('blob:')) {
    return idbCached;
  }

  // 2. Check localStorage cache
  try {
    const cached = localStorage.getItem(localKey(ideaId));
    if (cached && !cached.startsWith('blob:')) {
      await idbSet(idbKey(ideaId), cached);
      return cached;
    }
  } catch {}

  // 3. Check ROOT node's imageUrl (synced via database)
  const rootNode = nodeRepo.getAllByIdeaId(ideaId).find(n => n.isRoot);
  if (rootNode?.imageUrl && !rootNode.imageUrl.startsWith('blob:')) {
    await idbSet(idbKey(ideaId), rootNode.imageUrl);
    return rootNode.imageUrl;
  }

  // 4. Query Supabase Storage via SDK list
  if (!supabase) return null;
  try {
    const { data: files, error } = await supabase.storage.from(BUCKET).list(ideaId);
    if (!error && files && files.length > 0) {
      const mapFile = files.find(f => f.name.startsWith('map.'));
      if (mapFile) {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${ideaId}/${mapFile.name}`);
        if (data?.publicUrl) {
          await idbSet(idbKey(ideaId), data.publicUrl);
          try {
            localStorage.setItem(localKey(ideaId), data.publicUrl);
          } catch {}
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
  await idbDelete(idbKey(ideaId));
  try {
    localStorage.removeItem(localKey(ideaId));
    localStorage.removeItem(settingsKey(ideaId));
    sessionStorage.removeItem(localKey(ideaId));
  } catch {}

  const rootNode = nodeRepo.getAllByIdeaId(ideaId).find(n => n.isRoot);
  if (rootNode) {
    nodeRepo.update(rootNode.id, { imageUrl: undefined });
  }

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

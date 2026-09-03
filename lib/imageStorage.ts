'use client';

import { supabase } from '@/lib/supabase';

const BUCKET = 'world-maps';

/**
 * Read File object as base64 Data URL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read image as data URL'));
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an entity image to Supabase Storage with local fallback
 */
export async function uploadEntityImage(
  ideaId: string,
  file: File,
  nodeId?: string
): Promise<string> {
  // 1. Convert to data URL for immediate guarantee
  const dataUrl = await readFileAsDataUrl(file);

  if (!supabase) {
    return dataUrl;
  }

  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const cleanId = (nodeId || Math.random().toString(36).substring(2, 9)).replace(/[^a-zA-Z0-9_-]/g, '');
    const path = `${ideaId}/nodes/${cleanId}_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (error) {
      console.warn('Entity image cloud upload error (using local data URL):', error.message);
      return dataUrl;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    if (data?.publicUrl) {
      return data.publicUrl;
    }

    return dataUrl;
  } catch (err) {
    console.error('Exception uploading entity image:', err);
    return dataUrl;
  }
}

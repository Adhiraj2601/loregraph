import { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createBrowserSupabaseClient, isSupabaseConfigured } from './supabase/client';

export { isSupabaseConfigured, createBrowserSupabaseClient };

export const supabase: SupabaseClient | null = createBrowserSupabaseClient();

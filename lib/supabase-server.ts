import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client
 * Uses the same URL but uses service role key if available, otherwise anon key
 * For server actions and API routes
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseServer = createClient(supabaseUrl, supabaseKey);

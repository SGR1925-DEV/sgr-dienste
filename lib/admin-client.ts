'use client';

import { supabase } from '@/lib/supabase';

type AdminResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function fetchAdmin<T>(path: string, body?: unknown): Promise<AdminResponse<T>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body ?? {}),
  });

  const payload = (await response.json()) as AdminResponse<T>;
  if (!response.ok || payload?.success === false) {
    const message = payload?.error || 'Unbekannter Fehler';
    throw new Error(message);
  }

  return payload;
}

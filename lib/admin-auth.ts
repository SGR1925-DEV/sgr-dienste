import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function requireAdmin(request: NextRequest) {
  const adminSecret = process.env.ADMIN_API_SECRET;
  const secretHeader = request.headers.get('x-admin-secret');

  if (adminSecret && secretHeader === adminSecret) {
    return { ok: true };
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (token) {
      const { data, error } = await supabaseServer.auth.getUser(token);
      if (data?.user && !error) {
        // TODO: Optional Role/Claim-Check fuer Admins ergaenzen.
        return { ok: true };
      }
    }
  }

  return { ok: false, status: 401, error: 'Unauthorized' };
}

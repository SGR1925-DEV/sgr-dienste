import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await request.json();
    const slotId = Number(body?.id);

    if (!slotId) {
      return NextResponse.json({ success: false, error: 'id fehlt' }, { status: 400 });
    }

    const { error } = await adminSupabase.from('slots').delete().eq('id', slotId);
    if (error) {
      return NextResponse.json({ success: false, error: 'Fehler beim Löschen' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage' }, { status: 400 });
  }
}

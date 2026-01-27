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

    const updates: Record<string, unknown> = {};
    if (body?.match_id !== undefined) {
      const matchId = Number(body.match_id);
      if (!matchId) {
        return NextResponse.json({ success: false, error: 'match_id ungültig' }, { status: 400 });
      }
      updates.match_id = matchId;
    }

    if (body?.category !== undefined) {
      const category = String(body.category || '').trim();
      if (!category) {
        return NextResponse.json({ success: false, error: 'category ungültig' }, { status: 400 });
      }
      updates.category = category;
    }

    if (body?.time !== undefined) {
      const time = String(body.time || '').trim();
      if (!time) {
        return NextResponse.json({ success: false, error: 'time ungültig' }, { status: 400 });
      }
      updates.time = time;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'duration_minutes')) {
      if (body.duration_minutes === null || body.duration_minutes === '') {
        updates.duration_minutes = null;
      } else {
        const parsed = Number(body.duration_minutes);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          return NextResponse.json({ success: false, error: 'Dauer muss > 0 sein' }, { status: 400 });
        }
        updates.duration_minutes = Math.round(parsed);
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'Keine Updates vorhanden' }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from('slots')
      .update(updates)
      .eq('id', slotId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: 'Fehler beim Aktualisieren' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage' }, { status: 400 });
  }
}

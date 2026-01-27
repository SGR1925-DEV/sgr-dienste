import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/admin-auth';

const deriveDuration = (time: string) => {
  if (!time) return null;
  if (time.toLowerCase().includes('ende')) return 120;
  const times = time.match(/(\d{1,2}):(\d{2})/g);
  if (!times || times.length < 2) return null;
  const [start, end] = times;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if ([sh, sm, eh, em].some(value => Number.isNaN(value))) return null;
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff > 0 ? diff : null;
};

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await request.json();
    const matchId = Number(body?.match_id);
    const category = String(body?.category || '').trim();
    const time = String(body?.time || '').trim();

    if (!matchId || !category || !time) {
      return NextResponse.json({ success: false, error: 'Pflichtfelder fehlen' }, { status: 400 });
    }

    let durationMinutes: number | null = null;
    if (body?.duration_minutes !== undefined && body?.duration_minutes !== null && body?.duration_minutes !== '') {
      const parsed = Number(body.duration_minutes);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json({ success: false, error: 'Dauer muss > 0 sein' }, { status: 400 });
      }
      durationMinutes = Math.round(parsed);
    } else {
      durationMinutes = deriveDuration(time);
    }

    const { data, error } = await adminSupabase
      .from('slots')
      .insert({
        match_id: matchId,
        category,
        time,
        duration_minutes: durationMinutes,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: 'Fehler beim Erstellen' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage' }, { status: 400 });
  }
}

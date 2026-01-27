import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slotId = Number(body?.slotId);

    if (!slotId) {
      return NextResponse.json({ success: false, error: 'slotId fehlt' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('slots')
      .update({
        user_name: null,
        user_contact: null,
        cancellation_requested: false,
      })
      .eq('id', slotId);

    if (error) {
      return NextResponse.json({ success: false, error: 'Fehler beim Aktualisieren' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage' }, { status: 400 });
  }
}

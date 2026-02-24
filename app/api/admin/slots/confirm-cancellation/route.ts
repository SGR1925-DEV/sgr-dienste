import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { confirmCancellation } from '@/lib/admin-slots-service';
import { supabaseServer } from '@/lib/supabase-server';
import { getMatchDisplayDate } from '@/lib/utils';
import { sendCancellationEmail, isValidEmail } from '@/lib/email';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await request.json();
    const slotId = Number(body?.slotId ?? body?.id);
    if (!slotId) {
      return NextResponse.json({ success: false, error: 'Slot-ID fehlt' }, { status: 400 });
    }

    // Slot mit Match laden, bevor confirmCancellation user_contact/user_name löscht
    const { data: slot, error: slotError } = await supabaseServer
      .from('slots')
      .select(`
        id,
        category,
        user_name,
        user_contact,
        match_id,
        match:matches(id, opponent, date, match_date, team)
      `)
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ success: false, error: 'Slot nicht gefunden' }, { status: 404 });
    }

    const userName = slot.user_name || 'Helfer';
    const userContact = slot.user_contact ? normalizeEmail(slot.user_contact) : null;
    const matchRaw = Array.isArray(slot.match) ? slot.match[0] : slot.match;
    const match = matchRaw as { id: number; opponent: string; date: string; match_date: string | null; team?: string | null } | null | undefined;

    const { error } = await confirmCancellation(slotId);
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    // Stornierungs-Mail an den Nutzer senden (wie in adminConfirmCancellation)
    if (match && userContact && isValidEmail(userContact)) {
      try {
        const formattedDate = getMatchDisplayDate(match.match_date, match.date);
        const matchTitle = match.team
          ? `${match.team} vs. ${match.opponent}`
          : `Heimspiel vs. ${match.opponent}`;
        await sendCancellationEmail(userContact, userName, slot.category, matchTitle, formattedDate);
      } catch (emailError) {
        console.error('[confirm-cancellation] Stornierungs-Mail fehlgeschlagen:', emailError);
        // Austragung war erfolgreich, Mail-Fehler nicht an Client zurückgeben
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage' }, { status: 400 });
  }
}

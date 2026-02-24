'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { getMatchDisplayDate } from '@/lib/utils';
import {
  sendConfirmationEmail,
  sendCancellationEmail,
  sendAdminCancellationNotification,
  isValidEmail,
} from '@/lib/email';
import { RpcSlotResult } from '@/types';

interface ActionResult {
  success: boolean;
  error?: string;
  /** Nur bei success: true – ob die Bestätigungs-Mail versendet wurde */
  emailSent?: boolean;
  /** Wenn emailSent === false, Grund (z. B. für Anzeige in der App) */
  emailError?: string;
}

const normalizeName = (name: string) => name.trim();
const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Slot + Match laden und Bestätigungs-Mail versenden (für normale Buchung und für „bereits eingetragen“).
 */
async function sendConfirmationForSlot(
  slotId: number,
  to: string,
  name: string
): Promise<{ sent: boolean; error?: string }> {
  const { data: slot, error: slotError } = await supabaseServer
    .from('slots')
    .select(`
      *,
      match:matches(id, opponent, date, match_date, time, location, team)
    `)
    .eq('id', slotId)
    .single();
  if (slotError || !slot) {
    return { sent: false, error: slotError?.message ?? 'Slot nicht gefunden.' };
  }
  let match = slot.match as Record<string, unknown> | null | undefined;
  if (!match && slot.match_id) {
    const { data: matchRow } = await supabaseServer
      .from('matches')
      .select('id, opponent, date, match_date, time, location, team')
      .eq('id', slot.match_id)
      .single();
    match = matchRow ?? undefined;
  }
  if (!match) {
    return { sent: false, error: 'Match-Daten fehlen.' };
  }
  try {
    const formattedDate = getMatchDisplayDate(match.match_date as string | null, match.date as string);
    const matchTitle = match.team
      ? `${match.team} vs. ${match.opponent}`
      : `Heimspiel vs. ${match.opponent}`;
    await sendConfirmationEmail(
      to,
      name,
      slot.category,
      matchTitle,
      formattedDate,
      slot.time,
      match.location as string | undefined
    );
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : 'E-Mail-Versand fehlgeschlagen.' };
  }
}

/**
 * Server Action: Slot buchen
 * Setzt user_name + user_contact, helper_id wird per Trigger gesetzt.
 */
export async function bookSlot(
  slotId: number,
  name: string,
  email: string
): Promise<ActionResult> {
  try {
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);

    // Validate inputs
    if (!normalizedName || normalizedName.length < 2) {
      return { success: false, error: 'Name muss mindestens 2 Zeichen lang sein' };
    }

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return { success: false, error: 'Bitte eine gültige E-Mail-Adresse angeben' };
    }

    const { data, error } = await supabaseServer.rpc('book_slot', {
      p_slot_id: slotId,
      p_name: normalizedName,
      p_email: normalizedEmail,
    });

    if (error) {
      console.error('[bookSlot] RPC book_slot error:', error);
      return {
        success: false,
        error: `Fehler beim Speichern: ${'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Bitte erneut versuchen.'}`,
      };
    }

    let result = (Array.isArray(data) ? data[0] : data) as RpcSlotResult | undefined;
    if (!result?.success) {
      const { data: currentSlot } = await supabaseServer
        .from('slots')
        .select('user_contact, user_name, match_id')
        .eq('id', slotId)
        .single();

      const contactMatch = currentSlot?.user_contact?.toLowerCase() === normalizedEmail;
      const slotStillEmpty = !currentSlot?.user_contact && !currentSlot?.user_name;

      if (contactMatch && currentSlot?.match_id) {
        revalidatePath(`/match/${currentSlot.match_id}`);
        revalidatePath('/');
        const emailResult = await sendConfirmationForSlot(slotId, normalizedEmail, normalizedName);
        return { success: true, emailSent: emailResult.sent, emailError: emailResult.error };
      }

      if (slotStillEmpty) {
        // RPC sagte „belegt“, Slot ist aber noch leer – z. B. Race oder temporärer Fehler → einmal erneut versuchen
        const retry = await supabaseServer.rpc('book_slot', {
          p_slot_id: slotId,
          p_name: normalizedName,
          p_email: normalizedEmail,
        });
        const retryResult = (Array.isArray(retry.data) ? retry.data[0] : retry.data) as RpcSlotResult | undefined;
        if (!retry.error && retryResult?.success) {
          result = retryResult;
          // Weiter mit normalem Ablauf (Slot laden, E-Mail senden) – nicht return, Fall durchlassen
        } else {
          return {
            success: false,
            error: 'Der Slot konnte nicht gebucht werden. Bitte Seite neu laden und es erneut versuchen.',
          };
        }
      } else {
        return { success: false, error: 'Slot wurde gerade belegt' };
      }
    }

    const { data: slot, error: slotError } = await supabaseServer
      .from('slots')
      .select(`
        *,
        match:matches(
          id,
          opponent,
          date,
          match_date,
          time,
          location,
          team
        )
      `)
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      revalidatePath('/');
      return {
        success: true,
        emailSent: false,
        emailError: slotError?.message ? `Slot-Daten nicht geladen: ${slotError.message}` : 'Slot-Daten konnten nach der Buchung nicht geladen werden.',
      };
    }

    let match = slot.match as Record<string, unknown> | null | undefined;
    if (!match && slot.match_id) {
      const { data: matchRow } = await supabaseServer
        .from('matches')
        .select('id, opponent, date, match_date, time, location, team')
        .eq('id', slot.match_id)
        .single();
      match = matchRow ?? undefined;
    }
    let emailSent = false;
    let emailErrorMsg: string | undefined;

    if (!match) {
      emailErrorMsg = 'Match-Daten für E-Mail fehlen.';
    } else {
      const formattedDate = getMatchDisplayDate(match.match_date as string | null, match.date as string);
      const matchTitle = match.team
        ? `${match.team} vs. ${match.opponent}`
        : `Heimspiel vs. ${match.opponent}`;

      try {
        await sendConfirmationEmail(
          normalizedEmail,
          normalizedName,
          slot.category,
          matchTitle,
          formattedDate,
          slot.time,
          match.location as string | undefined
        );
        emailSent = true;
      } catch (err) {
        emailErrorMsg = err instanceof Error ? err.message : 'Unbekannter Fehler beim E-Mail-Versand.';
      }
    }

    // Revalidate the match page to show updated slot status
    const matchId = slot?.match_id ?? (match as { id?: number } | undefined)?.id;
    if (matchId) {
      revalidatePath(`/match/${matchId}`);
    }
    revalidatePath('/'); // Also revalidate homepage for leaderboard updates

    return { success: true, emailSent, emailError: emailErrorMsg };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Backward compatibility: old name
 */
export async function signUpForSlot(
  slotId: number,
  name: string,
  contact: string
): Promise<ActionResult> {
  return bookSlot(slotId, name, contact);
}

/**
 * Server Action: Austragen beantragen
 * Sets cancellation_requested flag but does NOT remove the user
 * Sends email notification to admin
 */
export async function requestCancellation(slotId: number, email: string): Promise<ActionResult> {
  try {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return { success: false, error: 'Bitte eine gültige E-Mail-Adresse angeben' };
    }

    const { data, error } = await supabaseServer.rpc('request_cancellation', {
      p_slot_id: slotId,
      p_email: normalizedEmail,
      p_clear_contact: true,
    });

    if (error) {
      console.error('[requestCancellation] RPC error:', error);
      return {
        success: false,
        error: 'message' in error && typeof error.message === 'string' ? error.message : 'Fehler beim Speichern. Bitte erneut versuchen.',
      };
    }

    const result = (Array.isArray(data) ? data[0] : data) as RpcSlotResult | undefined;
    if (!result?.success) {
      return { success: false, error: 'E-Mail passt nicht zur Buchung' };
    }

    const { data: slot, error: slotError } = await supabaseServer
      .from('slots')
      .select(`
        *,
        match:matches(
          id,
          opponent,
          date,
          match_date,
          team
        )
      `)
      .eq('id', slotId)
      .single();

    if (!slotError && slot) {
      const match = slot.match as any;
      if (match && slot.user_name) {
        const formattedDate = getMatchDisplayDate(match.match_date, match.date);
        
        try {
          await sendAdminCancellationNotification(
            slot.user_name,
            slot.category,
            formattedDate,
            match.opponent
          );
        } catch (emailError) {
          // Log email error but don't fail the cancellation request
          console.error('Failed to send admin cancellation notification:', emailError);
          // Continue - the cancellation request was successful even if email fails
        }
      }
    }

    // Revalidate the match page
    const matchId = slot?.match_id ?? slot?.match?.id;
    if (matchId) {
      revalidatePath(`/match/${matchId}`);
    }
    revalidatePath('/admin'); // Also revalidate admin page to show cancellation requests
    revalidatePath('/'); // Also revalidate homepage

    return { success: true };
  } catch (error) {
    console.error('Cancellation request error:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Admin bestätigt Austragung
 * Entfernt Nutzer, setzt cancellation_requested=false
 */
export async function adminConfirmCancellation(slotId: number): Promise<ActionResult> {
  try {
    // Fetch slot with match information to get user contact and match details
    const { data: slot, error: slotError } = await supabaseServer
      .from('slots')
      .select(`
        *,
        match:matches(
          id,
          opponent,
          date,
          match_date,
          team
        )
      `)
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return { success: false, error: 'Slot nicht gefunden' };
    }

    if (!slot.user_name && !slot.user_contact) {
      return { success: false, error: 'Dieser Slot ist nicht belegt' };
    }

    if (!slot.cancellation_requested) {
      return { success: false, error: 'Keine offene Austragungsanfrage' };
    }

    // Store user info before deletion for email
    const userName = slot.user_name || 'Helfer';
    const userContact = slot.user_contact ? normalizeEmail(slot.user_contact) : null;
    const match = slot.match as any;

    // Update slot: remove user and reset cancellation flag
    const { data: updatedSlots, error: updateError } = await supabaseServer
      .from('slots')
      .update({
        user_name: null,
        user_contact: null,
        cancellation_requested: false,
      })
      .eq('id', slotId)
      .eq('cancellation_requested', true)
      .select('id');

    if (updateError) {
      return { success: false, error: 'Fehler beim Entfernen. Bitte erneut versuchen.' };
    }

    if (!updatedSlots || updatedSlots.length === 0) {
      return { success: false, error: 'Die Anfrage wurde bereits bearbeitet' };
    }

    // Send cancellation email if contact is a valid email
    if (match && userContact && isValidEmail(userContact)) {
      try {
        const formattedDate = getMatchDisplayDate(match.match_date, match.date);
        const matchTitle = match.team 
          ? `${match.team} vs. ${match.opponent}`
          : `Heimspiel vs. ${match.opponent}`;

        await sendCancellationEmail(
          userContact,
          userName,
          slot.category,
          matchTitle,
          formattedDate
        );
      } catch (emailError) {
        // Log email error but don't fail the removal
        console.error('Failed to send cancellation email:', emailError);
        // Continue - the removal was successful even if email fails
      }
    }

    // Revalidate paths
    revalidatePath(`/match/${match?.id ?? slot.match_id}`);
    revalidatePath('/admin');
    revalidatePath('/'); // Also revalidate homepage

    return { success: true };
  } catch (error) {
    console.error('Admin remove user error:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Admin lehnt Austragung ab
 * Setzt cancellation_requested=false, behält Nutzer
 */
export async function adminRejectCancellation(slotId: number): Promise<ActionResult> {
  try {
    const { data: slot, error: slotError } = await supabaseServer
      .from('slots')
      .select('id, match_id, cancellation_requested')
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return { success: false, error: 'Slot nicht gefunden' };
    }

    if (!slot.cancellation_requested) {
      return { success: false, error: 'Keine offene Austragungsanfrage' };
    }

    const { data: updatedSlots, error: updateError } = await supabaseServer
      .from('slots')
      .update({ cancellation_requested: false })
      .eq('id', slotId)
      .eq('cancellation_requested', true)
      .select('id');

    if (updateError) {
      return { success: false, error: 'Fehler beim Aktualisieren. Bitte erneut versuchen.' };
    }

    if (!updatedSlots || updatedSlots.length === 0) {
      return { success: false, error: 'Die Anfrage wurde bereits bearbeitet' };
    }

    revalidatePath(`/match/${slot.match_id}`);
    revalidatePath('/admin');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Admin reject cancellation error:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Admin removes user from slot
 * Fetches slot data, removes user, sends cancellation email, and revalidates
 */
export async function adminRemoveUser(slotId: number): Promise<ActionResult> {
  try {
    // Fetch slot with match information to get user contact and match details
    const { data: slot, error: slotError } = await supabaseServer
      .from('slots')
      .select(`
        *,
        match:matches(
          id,
          opponent,
          date,
          match_date,
          team
        )
      `)
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return { success: false, error: 'Slot nicht gefunden' };
    }

    if (!slot.user_name) {
      return { success: false, error: 'Dieser Slot ist nicht belegt' };
    }

    // Store user info before deletion for email
    const userName = slot.user_name || 'Helfer';
    const userContact = slot.user_contact ? normalizeEmail(slot.user_contact) : null;
    const match = slot.match as any;

    // Update slot: remove user and reset cancellation flag
    const { error: updateError } = await supabaseServer
      .from('slots')
      .update({
        user_name: null,
        user_contact: null,
        cancellation_requested: false,
      })
      .eq('id', slotId);

    if (updateError) {
      return { success: false, error: 'Fehler beim Entfernen. Bitte erneut versuchen.' };
    }

    // Send cancellation email if contact is a valid email
    if (match && userContact && isValidEmail(userContact)) {
      try {
        const formattedDate = getMatchDisplayDate(match.match_date, match.date);
        const matchTitle = match.team 
          ? `${match.team} vs. ${match.opponent}`
          : `Heimspiel vs. ${match.opponent}`;

        await sendCancellationEmail(
          userContact,
          userName,
          slot.category,
          matchTitle,
          formattedDate
        );
      } catch (emailError) {
        // Log email error but don't fail the removal
        console.error('Failed to send cancellation email:', emailError);
        // Continue - the removal was successful even if email fails
      }
    }

    // Revalidate paths
    revalidatePath(`/match/${match?.id ?? slot.match_id}`);
    revalidatePath('/admin');
    revalidatePath('/'); // Also revalidate homepage

    return { success: true };
  } catch (error) {
    console.error('Admin remove user error:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

// Smoke-Test-Plan:
// 1) Public list loads via slots_public
// 2) book_slot RPC success
// 3) double booking fails with error
// 4) request_cancellation requires correct email
// 5) admin confirm frees slot
// 6) admin create slot ok
// 7) admin update duration ok
// 8) admin delete slot ok

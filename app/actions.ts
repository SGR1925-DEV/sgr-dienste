'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { formatDisplayDate } from '@/lib/utils';
import {
  sendConfirmationEmail,
  sendCancellationEmail,
  sendAdminCancellationNotification,
  isValidEmail,
} from '@/lib/email';

interface ActionResult {
  success: boolean;
  error?: string;
}

const normalizeName = (name: string) => name.trim();
const normalizeEmail = (email: string) => email.trim().toLowerCase();

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

    // Fetch slot details including match information
    const { data: slot, error: slotError } = await supabaseServer
      .from('slots')
      .select(`
        *,
        match:matches(
          id,
          opponent,
          date,
          time,
          location,
          team
        )
      `)
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return { success: false, error: 'Slot nicht gefunden' };
    }

    // Check if slot is already taken
    if (slot.user_name || slot.user_contact) {
      return { success: false, error: 'Dieser Slot ist bereits vergeben' };
    }

    // Update slot in database with optimistic concurrency check
    const { data: updatedSlots, error: updateError } = await supabaseServer
      .from('slots')
      .update({
        user_name: normalizedName,
        user_contact: normalizedEmail,
        cancellation_requested: false, // Reset cancellation flag on new sign-up
      })
      .eq('id', slotId)
      .is('user_contact', null)
      .eq('cancellation_requested', false)
      .select('id');

    if (updateError) {
      return { success: false, error: 'Fehler beim Speichern. Bitte erneut versuchen.' };
    }

    if (!updatedSlots || updatedSlots.length === 0) {
      return { success: false, error: 'Slot wurde gerade belegt' };
    }

    // Send confirmation email only if contact is a valid email
    const match = slot.match as any;
    if (match) {
      const formattedDate = formatDisplayDate(match.date);
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
          match.location
        );
      } catch (emailError) {
        // Log email error but don't fail the sign-up
        console.error('Failed to send confirmation email:', emailError);
        // Continue - the sign-up was successful even if email fails
      }
    }

    // Revalidate the match page to show updated slot status
    revalidatePath(`/match/${match?.id ?? slot.match_id}`);
    revalidatePath('/'); // Also revalidate homepage for leaderboard updates

    return { success: true };
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
export async function requestCancellation(slotId: number): Promise<ActionResult> {
  try {
    // Fetch slot with full match information
    const { data: slot, error: slotError } = await supabaseServer
      .from('slots')
      .select(`
        *,
        match:matches(
          id,
          opponent,
          date,
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

    if (slot.cancellation_requested) {
      return { success: false, error: 'Die Absage wurde bereits beantragt' };
    }

    // Update slot: set cancellation_requested = true
    // Datenschutz/Helper-Logik: user_contact bleibt bis Admin bestätigt.
    // TODO: Option B (spaeter): user_contact sofort loeschen bei cancellation_requested=true.
    const { data: updatedSlots, error: updateError } = await supabaseServer
      .from('slots')
      .update({
        cancellation_requested: true,
      })
      .eq('id', slotId)
      .eq('cancellation_requested', false)
      .select('id');

    if (updateError) {
      return { success: false, error: 'Fehler beim Speichern. Bitte erneut versuchen.' };
    }

    if (!updatedSlots || updatedSlots.length === 0) {
      return { success: false, error: 'Die Anfrage wurde bereits bearbeitet' };
    }

    // Send admin notification email (don't fail if email fails)
    const match = slot.match as any;
    if (match && slot.user_name) {
      const formattedDate = formatDisplayDate(match.date);
      
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

    // Revalidate the match page
    revalidatePath(`/match/${match?.id ?? slot.match_id}`);
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
        const formattedDate = formatDisplayDate(match.date);
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
        const formattedDate = formatDisplayDate(match.date);
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

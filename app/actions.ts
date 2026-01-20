'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { formatDisplayDate } from '@/lib/utils';
import { sendConfirmationEmail, sendCancellationEmail, sendAdminCancellationNotification, isValidEmail } from '@/lib/email';

interface SignUpResult {
  success: boolean;
  error?: string;
}

interface CancellationResult {
  success: boolean;
  error?: string;
}

interface AdminRemoveResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: Sign up for a service slot
 * Updates the slot in Supabase and sends a confirmation email (if contact is an email)
 */
export async function signUpForSlot(
  slotId: number,
  name: string,
  contact: string
): Promise<SignUpResult> {
  try {
    // Validate inputs
    if (!name || name.length < 2) {
      return { success: false, error: 'Name muss mindestens 2 Zeichen lang sein' };
    }

    if (!contact || contact.trim().length === 0) {
      return { success: false, error: 'Bitte Kontaktinformationen angeben' };
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
    if (slot.user_name) {
      return { success: false, error: 'Dieser Slot ist bereits vergeben' };
    }

    // Update slot in database
    const { error: updateError } = await supabaseServer
      .from('slots')
      .update({
        user_name: name,
        user_contact: contact.trim(),
        cancellation_requested: false, // Reset cancellation flag on new sign-up
      })
      .eq('id', slotId);

    if (updateError) {
      return { success: false, error: 'Fehler beim Speichern. Bitte erneut versuchen.' };
    }

    // Send confirmation email only if contact is a valid email
    const match = slot.match as any;
    const formattedDate = formatDisplayDate(match.date);
    const matchTitle = match.team 
      ? `${match.team} vs. ${match.opponent}`
      : `Heimspiel vs. ${match.opponent}`;

    if (isValidEmail(contact.trim())) {
      try {
        await sendConfirmationEmail(
          contact.trim(),
          name,
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
    revalidatePath(`/match/${match.id}`);
    revalidatePath('/'); // Also revalidate homepage for leaderboard updates

    return { success: true };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Request cancellation for a slot
 * Sets cancellation_requested flag but does NOT remove the user
 * Sends email notification to admin
 */
export async function requestCancellation(slotId: number): Promise<CancellationResult> {
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

    if (!slot.user_name) {
      return { success: false, error: 'Dieser Slot ist nicht belegt' };
    }

    // Update slot: set cancellation_requested = true
    const { error: updateError } = await supabaseServer
      .from('slots')
      .update({
        cancellation_requested: true,
      })
      .eq('id', slotId);

    if (updateError) {
      return { success: false, error: 'Fehler beim Speichern. Bitte erneut versuchen.' };
    }

    // Send admin notification email (don't fail if email fails)
    const match = slot.match as any;
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

    // Revalidate the match page
    revalidatePath(`/match/${match.id}`);
    revalidatePath('/admin'); // Also revalidate admin page to show cancellation requests
    revalidatePath('/'); // Also revalidate homepage

    return { success: true };
  } catch (error) {
    console.error('Cancellation request error:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

/**
 * Server Action: Admin removes user from slot
 * Fetches slot data, removes user, sends cancellation email, and revalidates
 */
export async function adminRemoveUser(slotId: number): Promise<AdminRemoveResult> {
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
    const userName = slot.user_name;
    const userContact = slot.user_contact;
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
    if (userContact && isValidEmail(userContact)) {
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
    revalidatePath(`/match/${match.id}`);
    revalidatePath('/admin');
    revalidatePath('/'); // Also revalidate homepage

    return { success: true };
  } catch (error) {
    console.error('Admin remove user error:', error);
    return { success: false, error: 'Ein unerwarteter Fehler ist aufgetreten' };
  }
}

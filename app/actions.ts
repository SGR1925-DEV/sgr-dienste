'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { Resend } from 'resend';
import { revalidatePath } from 'next/cache';
import { formatDisplayDate } from '@/lib/utils';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SignUpResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: Sign up for a service slot
 * Updates the slot in Supabase and sends a confirmation email
 */
export async function signUpForSlot(
  slotId: number,
  name: string,
  email: string
): Promise<SignUpResult> {
  try {
    // Validate inputs
    if (!name || name.length < 2) {
      return { success: false, error: 'Name muss mindestens 2 Zeichen lang sein' };
    }

    if (!email || !email.includes('@')) {
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
    if (slot.user_name) {
      return { success: false, error: 'Dieser Slot ist bereits vergeben' };
    }

    // Update slot in database
    const { error: updateError } = await supabaseServer
      .from('slots')
      .update({
        user_name: name,
        user_contact: email,
      })
      .eq('id', slotId);

    if (updateError) {
      return { success: false, error: 'Fehler beim Speichern. Bitte erneut versuchen.' };
    }

    // Send confirmation email
    const match = slot.match as any;
    const formattedDate = formatDisplayDate(match.date);
    const matchTitle = match.team 
      ? `${match.team} vs. ${match.opponent}`
      : `Heimspiel vs. ${match.opponent}`;

    try {
      await resend.emails.send({
        from: 'SG Ruwertal <noreply@sgruwertal.de>', // TODO: Update with your verified domain
        to: email,
        subject: 'Bestätigung: Dein Dienst beim SG Ruwertal',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1e293b; margin-bottom: 20px;">Hallo ${name},</h1>
            <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
              danke für deinen Einsatz! Du bist erfolgreich eingetragen für:
            </p>
            <div style="background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e293b; font-size: 18px;">
                ${slot.category}
              </p>
              <p style="margin: 5px 0; color: #475569;">
                <strong>Spiel:</strong> ${matchTitle}
              </p>
              <p style="margin: 5px 0; color: #475569;">
                <strong>Datum:</strong> ${formattedDate}
              </p>
              <p style="margin: 5px 0; color: #475569;">
                <strong>Uhrzeit:</strong> ${slot.time}
              </p>
              ${match.location ? `<p style="margin: 5px 0; color: #475569;"><strong>Ort:</strong> ${match.location}</p>` : ''}
            </div>
            <p style="color: #475569; line-height: 1.6;">
              Wir freuen uns auf deinen Einsatz! 🏆
            </p>
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              Mit sportlichen Grüßen,<br>
              SG Ruwertal
            </p>
          </div>
        `,
        text: `
Hallo ${name},

danke für deinen Einsatz! Du bist erfolgreich eingetragen für:

${slot.category}
Spiel: ${matchTitle}
Datum: ${formattedDate}
Uhrzeit: ${slot.time}
${match.location ? `Ort: ${match.location}` : ''}

Wir freuen uns auf deinen Einsatz! 🏆

Mit sportlichen Grüßen,
SG Ruwertal
        `,
      });
    } catch (emailError) {
      // Log email error but don't fail the sign-up
      console.error('Failed to send confirmation email:', emailError);
      // Continue - the sign-up was successful even if email fails
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

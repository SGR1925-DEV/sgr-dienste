import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { Resend } from 'resend';
import { getMatchDateForComparison, getMatchDisplayDate } from '@/lib/utils';
import { isValidEmail } from '@/lib/email';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Cron Job API Route for sending reminder emails
 * Should be triggered by Vercel Cron or similar
 * 
 * Security: Check for Authorization header or query secret
 */
export async function GET(request: NextRequest) {
  try {
    // Security: Check for authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const querySecret = request.nextUrl.searchParams.get('secret');

    // Allow if:
    // 1. Authorization header matches CRON_SECRET (Vercel Cron)
    // 2. Query param secret matches CRON_SECRET (manual trigger for testing)
    // 3. No CRON_SECRET is set (development only - remove in production!)
    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}` && querySecret !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate date 2 days from now
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 2);
    targetDate.setHours(0, 0, 0, 0);

    // Fetch all matches (we need to parse dates to find matches in 2 days)
    const { data: allMatches, error: matchesError } = await supabaseServer
      .from('matches')
      .select('*');

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }

    if (!allMatches || allMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No matches found',
        remindersSent: 0,
      });
    }

    // Filter matches that are happening in 2 days
    const matches = allMatches.filter(match => {
      const matchDate = getMatchDateForComparison(match.match_date, match.date);
      if (!matchDate) return false;
      
      const matchDateOnly = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      matchDateOnly.setHours(0, 0, 0, 0);
      
      // Check if match date equals target date (2 days from now)
      return matchDateOnly.getTime() === targetDate.getTime();
    });

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No matches in 2 days',
        remindersSent: 0,
      });
    }

    let remindersSent = 0;
    const errors: string[] = [];

    // Process each match
    for (const match of matches) {
      // Fetch all filled slots for this match where user_contact is present
      const { data: slots, error: slotsError } = await supabaseServer
        .from('slots')
        .select('*')
        .eq('match_id', match.id)
        .not('user_name', 'is', null)
        .not('user_contact', 'is', null);

      if (slotsError) {
        console.error(`Error fetching slots for match ${match.id}:`, slotsError);
        errors.push(`Match ${match.id}: Failed to fetch slots`);
        continue;
      }

      if (!slots || slots.length === 0) {
        continue;
      }

      // Send reminder email for each slot
      for (const slot of slots) {
        if (!slot.user_contact || !slot.user_name) {
          continue;
        }

        // Only send emails to valid email addresses
        if (!isValidEmail(slot.user_contact)) {
          continue;
        }

        const formattedDate = getMatchDisplayDate(match.match_date, match.date);
        const matchTitle = match.team
          ? `${match.team} vs. ${match.opponent}`
          : `Heimspiel vs. ${match.opponent}`;

        try {
          await resend.emails.send({
            from: 'SG Ruwertal <noreply@sgruwertal.de>', // TODO: Update with your verified domain
            to: slot.user_contact,
            subject: `Erinnerung: Dein Dienst beim SG Ruwertal ist übermorgen!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #1e293b; margin-bottom: 20px;">Hallo ${slot.user_name},</h1>
                <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
                  freundliche Erinnerung: Dein Dienst ist <strong>übermorgen</strong>!
                </p>
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
                  <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e293b; font-size: 18px;">
                    ${slot.category}
                  </p>
                  <p style="margin: 5px 0; color: #475569;">
                    <strong>Spiel:</strong> ${matchTitle}
                  </p>
                  <p style="margin: 5px 0; color: #475569;">
                    <strong>Datum:</strong> ${formattedDate} (übermorgen)
                  </p>
                  <p style="margin: 5px 0; color: #475569;">
                    <strong>Uhrzeit:</strong> ${slot.time}
                  </p>
                  ${match.location ? `<p style="margin: 5px 0; color: #475569;"><strong>Ort:</strong> ${match.location}</p>` : ''}
                </div>
                <p style="color: #475569; line-height: 1.6;">
                  Bitte sei pünktlich vor Ort. Wir freuen uns auf deinen Einsatz! 🏆
                </p>
                <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                  Mit sportlichen Grüßen,<br>
                  SG Ruwertal
                </p>
              </div>
            `,
            text: `
Hallo ${slot.user_name},

freundliche Erinnerung: Dein Dienst ist übermorgen!

${slot.category}
Spiel: ${matchTitle}
Datum: ${formattedDate} (übermorgen)
Uhrzeit: ${slot.time}
${match.location ? `Ort: ${match.location}` : ''}

Bitte sei pünktlich vor Ort. Wir freuen uns auf deinen Einsatz! 🏆

Mit sportlichen Grüßen,
SG Ruwertal
            `,
          });

          remindersSent++;
        } catch (emailError) {
          console.error(`Failed to send reminder to ${slot.user_contact}:`, emailError);
          errors.push(`Slot ${slot.id}: Failed to send email`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reminder cron job completed`,
      remindersSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

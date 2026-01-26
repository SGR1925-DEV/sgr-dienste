'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { LeaderboardRow } from '@/types';

// TODO: Matches-Tabellenfeld fuer echtes Datum/Season hinterlegen (z.B. match_date/kickoff_at).
const MATCH_DATE_FIELD = 'match_date';

const sortLeaderboard = (rows: LeaderboardRow[]) =>
  rows.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    if (b.total_minutes !== a.total_minutes) return b.total_minutes - a.total_minutes;
    return a.helper_id.localeCompare(b.helper_id);
  });

export async function getLeaderboardBase(limit = 10) {
  const { data, error } = await supabaseServer
    .from('leaderboard_base')
    .select('helper_id,total_minutes,total_points,total_slots,last_match_date')
    .order('total_points', { ascending: false })
    .order('total_minutes', { ascending: false })
    .limit(limit);

  if (error) {
    return { data: null, error };
  }

  return { data: data as LeaderboardRow[], error: null };
}

export async function getLeaderboardByDateRange(startDate: Date, endDate: Date, limit = 10) {
  const { data, error } = await supabaseServer
    .from('slots')
    .select(`helper_id,duration_minutes,match:matches(${MATCH_DATE_FIELD})`)
    .not('helper_id', 'is', null)
    .eq('cancellation_requested', false)
    .gt('duration_minutes', 0);

  if (error) {
    return { data: null, error };
  }

  const rows = new Map<string, LeaderboardRow & { _lastMatch?: Date }>();

  data?.forEach((row: any) => {
    const helperId = row.helper_id as string | null;
    const duration = row.duration_minutes as number | null;
    const matchDateValue = row.match?.[MATCH_DATE_FIELD] as string | null | undefined;

    if (!helperId || !duration || duration <= 0 || !matchDateValue) return;

    const matchDate = new Date(matchDateValue);
    if (Number.isNaN(matchDate.getTime())) return;
    if (matchDate < startDate || matchDate > endDate) return;

    const existing = rows.get(helperId);
    const points = Math.floor(duration / 10);

    if (existing) {
      existing.total_minutes += duration;
      existing.total_points += points;
      existing.total_slots += 1;
      if (!existing._lastMatch || matchDate > existing._lastMatch) {
        existing._lastMatch = matchDate;
        existing.last_match_date = matchDate.toISOString();
      }
    } else {
      rows.set(helperId, {
        helper_id: helperId,
        total_minutes: duration,
        total_points: points,
        total_slots: 1,
        last_match_date: matchDate.toISOString(),
        _lastMatch: matchDate,
      });
    }
  });

  const leaderboard = sortLeaderboard(Array.from(rows.values()).map(({ _lastMatch, ...rest }) => rest));
  return { data: leaderboard.slice(0, limit), error: null };
}

export async function getLeaderboardForYear(year: number, limit = 10) {
  const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
  return getLeaderboardByDateRange(startDate, endDate, limit);
}

import { adminSupabase } from '@/lib/supabase-admin';

type ServiceResult<T> = {
  data: T | null;
  error?: string;
};

const normalizeDuration = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { error: 'Dauer muss > 0 sein' } as const;
  }
  return { value: Math.round(parsed) } as const;
};

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

export async function listSlots(matchId?: number): Promise<ServiceResult<any[]>> {
  let query = adminSupabase.from('slots').select('*').order('id');
  if (matchId) {
    query = query.eq('match_id', matchId);
  }

  const { data, error } = await query;
  if (error) {
    return { data: null, error: 'Fehler beim Laden' };
  }

  return { data: data ?? [] };
}

export async function createSlot(input: {
  match_id: unknown;
  category: unknown;
  time: unknown;
  duration_minutes?: unknown;
}): Promise<ServiceResult<any>> {
  const matchId = Number(input.match_id);
  const category = String(input.category || '').trim();
  const time = String(input.time || '').trim();

  if (!matchId || !category || !time) {
    return { data: null, error: 'Pflichtfelder fehlen' };
  }

  let durationMinutes: number | null = null;
  const durationResult = normalizeDuration(input.duration_minutes);
  if (durationResult && 'error' in durationResult) {
    return { data: null, error: durationResult.error };
  }
  if (durationResult && 'value' in durationResult) {
    durationMinutes = durationResult.value;
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
    return { data: null, error: 'Fehler beim Erstellen' };
  }

  return { data };
}

export async function updateSlot(input: {
  id: unknown;
  match_id?: unknown;
  category?: unknown;
  time?: unknown;
  duration_minutes?: unknown;
}): Promise<ServiceResult<any>> {
  const slotId = Number(input.id);
  if (!slotId) {
    return { data: null, error: 'id fehlt' };
  }

  const updates: Record<string, unknown> = {};

  if (input.match_id !== undefined) {
    const matchId = Number(input.match_id);
    if (!matchId) {
      return { data: null, error: 'match_id ungültig' };
    }
    updates.match_id = matchId;
  }

  if (input.category !== undefined) {
    const category = String(input.category || '').trim();
    if (!category) {
      return { data: null, error: 'category ungültig' };
    }
    updates.category = category;
  }

  if (input.time !== undefined) {
    const time = String(input.time || '').trim();
    if (!time) {
      return { data: null, error: 'time ungültig' };
    }
    updates.time = time;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'duration_minutes')) {
    if (input.duration_minutes === null || input.duration_minutes === '') {
      updates.duration_minutes = null;
    } else {
      const durationResult = normalizeDuration(input.duration_minutes);
      if (durationResult && 'error' in durationResult) {
        return { data: null, error: durationResult.error };
      }
      if (durationResult && 'value' in durationResult) {
        updates.duration_minutes = durationResult.value;
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return { data: null, error: 'Keine Updates vorhanden' };
  }

  const { data, error } = await adminSupabase
    .from('slots')
    .update(updates)
    .eq('id', slotId)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: 'Fehler beim Aktualisieren' };
  }

  return { data };
}

export async function deleteSlot(slotId: number): Promise<ServiceResult<null>> {
  if (!slotId) {
    return { data: null, error: 'id fehlt' };
  }

  const { error } = await adminSupabase.from('slots').delete().eq('id', slotId);
  if (error) {
    return { data: null, error: 'Fehler beim Löschen' };
  }

  return { data: null };
}

export async function deleteSlotsByMatch(matchId: number): Promise<ServiceResult<null>> {
  if (!matchId) {
    return { data: null, error: 'match_id fehlt' };
  }

  const { error } = await adminSupabase.from('slots').delete().eq('match_id', matchId);
  if (error) {
    return { data: null, error: 'Fehler beim Löschen' };
  }

  return { data: null };
}

export async function confirmCancellation(slotId: number): Promise<ServiceResult<null>> {
  if (!slotId) {
    return { data: null, error: 'id fehlt' };
  }

  const { error } = await adminSupabase
    .from('slots')
    .update({
      user_name: null,
      user_contact: null,
      cancellation_requested: false,
    })
    .eq('id', slotId);

  if (error) {
    return { data: null, error: 'Fehler beim Aktualisieren' };
  }

  return { data: null };
}

export async function rejectCancellation(slotId: number): Promise<ServiceResult<null>> {
  if (!slotId) {
    return { data: null, error: 'id fehlt' };
  }

  const { error } = await adminSupabase
    .from('slots')
    .update({ cancellation_requested: false })
    .eq('id', slotId);

  if (error) {
    return { data: null, error: 'Fehler beim Aktualisieren' };
  }

  return { data: null };
}

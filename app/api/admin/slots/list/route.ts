import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { listSlots } from '@/lib/admin-slots-service';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await request.json();
    const matchId = body?.match_id ? Number(body.match_id) : undefined;
    const { data, error } = await listSlots(matchId);
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage' }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { confirmCancellation } from '@/lib/admin-slots-service';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await request.json();
    const slotId = Number(body?.slotId ?? body?.id);
    const { error } = await confirmCancellation(slotId);
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Ungültige Anfrage' }, { status: 400 });
  }
}

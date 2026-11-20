import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getSystemStats } from '@/lib/data-store';

export async function GET() {
  const auth = await requireSession(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const stats = await getSystemStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to load system statistics.' }, { status: 500 });
  }
}

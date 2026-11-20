import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getUserById, updateUserAccount } from '@/lib/data-store';
import { profileUpdateSchema } from '@/lib/validation';

export async function GET() {
  const auth = await requireSession(['ADMIN', 'DOCTOR', 'PATIENT']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const user = await getUserById(auth.session.user.id);
  if (!user) {
    return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const auth = await requireSession(['ADMIN', 'DOCTOR', 'PATIENT']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid profile data.' },
        { status: 400 }
      );
    }

    const updated = await updateUserAccount(auth.session.user.id, parsed.data);
    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}

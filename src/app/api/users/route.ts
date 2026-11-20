import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { ConflictError, createUserAccount, listUsers } from '@/lib/data-store';
import { adminCreateUserSchema } from '@/lib/validation';
import type { UserRole, UserStatus } from '@/types';

export async function GET(request: Request) {
  const auth = await requireSession(['ADMIN', 'DOCTOR', 'PATIENT']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const roleParam = searchParams.get('role') as UserRole | null;
  const statusParam = searchParams.get('status') as UserStatus | null;
  const search = searchParams.get('search') || undefined;

  const callerRole = auth.session.user.role;

  // Enforce least-privilege directory access
  if (callerRole === 'PATIENT') {
    const doctors = await listUsers({ role: 'DOCTOR', status: 'ACTIVE', search });
    return NextResponse.json({ users: doctors });
  }

  if (callerRole === 'DOCTOR') {
    const allowedRole: UserRole = roleParam === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';
    const users = await listUsers({ role: allowedRole, status: 'ACTIVE', search });
    return NextResponse.json({ users });
  }

  const users = await listUsers({
    role: roleParam || undefined,
    status: statusParam || undefined,
    search,
  });
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const auth = await requireSession(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = adminCreateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid user payload.' },
        { status: 400 }
      );
    }

    const user = await createUserAccount(parsed.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}

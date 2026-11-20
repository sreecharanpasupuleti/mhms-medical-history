import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import {
  ConflictError,
  NotFoundError,
  deleteUserAccount,
  getUserById,
  updateUserAccount,
} from '@/lib/data-store';
import { adminUpdateUserSchema } from '@/lib/validation';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession(['ADMIN', 'DOCTOR', 'PATIENT']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const isSelf = auth.session.user.id === params.id;
  if (auth.session.user.role !== 'ADMIN' && !isSelf) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await getUserById(params.id);
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const parsed = adminUpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid update payload.' },
        { status: 400 }
      );
    }

    const user = await updateUserAccount(params.id, parsed.data);
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession(['ADMIN']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.session.user.id === params.id) {
    return NextResponse.json(
      { error: 'Administrators cannot delete their own active account.' },
      { status: 400 }
    );
  }

  try {
    await deleteUserAccount(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  }
}

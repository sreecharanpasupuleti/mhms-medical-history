import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import {
  NotFoundError,
  deleteMedicalRecord,
  listMedicalRecords,
} from '@/lib/data-store';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession(['ADMIN', 'DOCTOR']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const all = await listMedicalRecords();
  const target = all.find((r) => r.id === params.id);
  if (!target) {
    return NextResponse.json({ error: 'Medical record not found.' }, { status: 404 });
  }

  if (auth.session.user.role === 'DOCTOR' && target.doctorId !== auth.session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await deleteMedicalRecord(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete medical record.' }, { status: 500 });
  }
}

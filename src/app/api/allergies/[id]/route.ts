import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { NotFoundError, deleteAllergy, listAllergies } from '@/lib/data-store';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession(['ADMIN', 'DOCTOR']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const all = await listAllergies();
  const target = all.find((a) => a.id === params.id);
  if (!target) {
    return NextResponse.json({ error: 'Allergy record not found.' }, { status: 404 });
  }

  try {
    await deleteAllergy(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete allergy.' }, { status: 500 });
  }
}

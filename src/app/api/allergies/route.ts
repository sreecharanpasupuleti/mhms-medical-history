import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { createAllergy, listAllergies } from '@/lib/data-store';
import { allergySchema } from '@/lib/validation';

export async function GET(request: Request) {
  const auth = await requireSession(['ADMIN', 'DOCTOR', 'PATIENT']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const patientIdParam = searchParams.get('patientId') || undefined;
  const { role, id: userId } = auth.session.user;

  const allergies = await listAllergies({
    ...(role === 'PATIENT' ? { patientId: userId } : patientIdParam ? { patientId: patientIdParam } : {}),
  });

  return NextResponse.json({ allergies });
}

export async function POST(request: Request) {
  const auth = await requireSession(['ADMIN', 'DOCTOR']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const doctorId =
      auth.session.user.role === 'DOCTOR' ? auth.session.user.id : body.doctorId;

    const parsed = allergySchema.safeParse({ ...body, doctorId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid allergy details.' },
        { status: 400 }
      );
    }

    const allergy = await createAllergy({
      patientId: parsed.data.patientId,
      doctorId,
      allergyName: parsed.data.allergyName,
      severity: parsed.data.severity,
      reaction: parsed.data.reaction,
      notes: parsed.data.notes,
      diagnosedDate: parsed.data.diagnosedDate,
    });

    return NextResponse.json({ allergy }, { status: 201 });
  } catch (error) {
    console.error('Create allergy error:', error);
    return NextResponse.json({ error: 'Failed to create allergy record.' }, { status: 500 });
  }
}

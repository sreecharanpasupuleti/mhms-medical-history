import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { createMedicalRecord, listMedicalRecords } from '@/lib/data-store';
import { medicalRecordSchema } from '@/lib/validation';

export async function GET(request: Request) {
  const auth = await requireSession(['ADMIN', 'DOCTOR', 'PATIENT']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const patientIdParam = searchParams.get('patientId') || undefined;
  const { role, id: userId } = auth.session.user;

  const records = await listMedicalRecords({
    ...(role === 'PATIENT' ? { patientId: userId } : patientIdParam ? { patientId: patientIdParam } : {}),
    ...(role === 'DOCTOR' ? { doctorId: userId } : {}),
  });

  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const auth = await requireSession(['ADMIN', 'DOCTOR']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const doctorId =
      auth.session.user.role === 'DOCTOR'
        ? auth.session.user.id
        : body.doctorId;

    const parsed = medicalRecordSchema.safeParse({ ...body, doctorId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid medical record data.' },
        { status: 400 }
      );
    }

    if (!doctorId) {
      return NextResponse.json({ error: 'Attending doctor is required.' }, { status: 400 });
    }

    const record = await createMedicalRecord({
      patientId: parsed.data.patientId,
      doctorId,
      diagnosis: parsed.data.diagnosis,
      symptoms: parsed.data.symptoms,
      treatment: parsed.data.treatment,
      notes: parsed.data.notes,
      recordDate: parsed.data.recordDate,
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error('Create medical record error:', error);
    return NextResponse.json({ error: 'Failed to create medical record.' }, { status: 500 });
  }
}

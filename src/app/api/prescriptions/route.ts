import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { createPrescription, listPrescriptions } from '@/lib/data-store';
import { prescriptionSchema } from '@/lib/validation';

export async function GET(request: Request) {
  const auth = await requireSession(['ADMIN', 'DOCTOR', 'PATIENT']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const patientIdParam = searchParams.get('patientId') || undefined;
  const { role, id: userId } = auth.session.user;

  const prescriptions = await listPrescriptions({
    ...(role === 'PATIENT' ? { patientId: userId } : patientIdParam ? { patientId: patientIdParam } : {}),
    ...(role === 'DOCTOR' ? { doctorId: userId } : {}),
  });

  return NextResponse.json({ prescriptions });
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

    const parsed = prescriptionSchema.safeParse({ ...body, doctorId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid prescription details.' },
        { status: 400 }
      );
    }

    if (!doctorId) {
      return NextResponse.json({ error: 'Prescribing doctor is required.' }, { status: 400 });
    }

    const prescription = await createPrescription({
      patientId: parsed.data.patientId,
      doctorId,
      medicineName: parsed.data.medicineName,
      dosage: parsed.data.dosage,
      frequency: parsed.data.frequency,
      duration: parsed.data.duration,
      instructions: parsed.data.instructions,
      prescribedDate: parsed.data.prescribedDate,
    });

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (error) {
    console.error('Create prescription error:', error);
    return NextResponse.json({ error: 'Failed to create prescription.' }, { status: 500 });
  }
}

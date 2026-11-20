import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import {
  ConflictError,
  createAppointment,
  listAppointments,
} from '@/lib/data-store';
import { appointmentCreateSchema } from '@/lib/validation';
import type { AppointmentStatus } from '@/types';

export async function GET(request: Request) {
  const auth = await requireSession(['ADMIN', 'DOCTOR', 'PATIENT']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const slotsOnly = searchParams.get('slotsOnly') === 'true';
  const doctorIdParam = searchParams.get('doctorId') || undefined;
  const dateParam = searchParams.get('date') || undefined;
  const statusParam = (searchParams.get('status') as AppointmentStatus | null) || undefined;

  // Return anonymized occupied time slots for double-booking prevention UI
  if (slotsOnly && doctorIdParam && dateParam) {
    const doctorAppts = await listAppointments({ doctorId: doctorIdParam });
    const bookedTimes = doctorAppts
      .filter((a) => a.appointmentDate === dateParam && a.status !== 'CANCELLED')
      .map((a) => a.appointmentTime);
    return NextResponse.json({ bookedTimes });
  }

  const role = auth.session.user.role;
  const userId = auth.session.user.id;

  const appointments = await listAppointments({
    ...(role === 'PATIENT' ? { patientId: userId } : {}),
    ...(role === 'DOCTOR' ? { doctorId: userId } : {}),
    ...(role === 'ADMIN' && doctorIdParam ? { doctorId: doctorIdParam } : {}),
    ...(statusParam ? { status: statusParam } : {}),
  });

  return NextResponse.json({ appointments });
}

export async function POST(request: Request) {
  const auth = await requireSession(['ADMIN', 'DOCTOR', 'PATIENT']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const role = auth.session.user.role;
    const userId = auth.session.user.id;

    const payload = {
      ...body,
      patientId: role === 'PATIENT' ? userId : body.patientId,
      doctorId: role === 'DOCTOR' ? userId : body.doctorId,
    };

    const parsed = appointmentCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid appointment details.' },
        { status: 400 }
      );
    }

    if (!parsed.data.patientId) {
      return NextResponse.json({ error: 'Patient selection is required.' }, { status: 400 });
    }

    const appointment = await createAppointment({
      patientId: parsed.data.patientId,
      doctorId: parsed.data.doctorId,
      appointmentDate: parsed.data.appointmentDate,
      appointmentTime: parsed.data.appointmentTime,
      reason: parsed.data.reason,
      notes: parsed.data.notes,
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Create appointment error:', error);
    return NextResponse.json({ error: 'Failed to create appointment.' }, { status: 500 });
  }
}

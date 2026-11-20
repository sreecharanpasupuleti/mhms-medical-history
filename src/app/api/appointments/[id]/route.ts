import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import {
  ConflictError,
  NotFoundError,
  deleteAppointment,
  getAppointmentById,
  updateAppointment,
} from '@/lib/data-store';
import { appointmentUpdateSchema } from '@/lib/validation';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession(['ADMIN', 'DOCTOR', 'PATIENT']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const appointment = await getAppointmentById(params.id);
  if (!appointment) {
    return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
  }

  const { role, id: userId } = auth.session.user;
  const authorized =
    role === 'ADMIN' ||
    (role === 'DOCTOR' && appointment.doctorId === userId) ||
    (role === 'PATIENT' && appointment.patientId === userId);

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ appointment });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession(['ADMIN', 'DOCTOR', 'PATIENT']);
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const existing = await getAppointmentById(params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
  }

  const { role, id: userId } = auth.session.user;

  try {
    const body = await request.json();
    const parsed = appointmentUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid appointment update.' },
        { status: 400 }
      );
    }

    if (role === 'PATIENT') {
      if (existing.patientId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (existing.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Patients can only cancel appointments that are still pending.' },
          { status: 400 }
        );
      }
      if (parsed.data.status !== 'CANCELLED') {
        return NextResponse.json(
          { error: 'Patients can only cancel their pending appointment.' },
          { status: 403 }
        );
      }
      const cancelled = await updateAppointment(params.id, { status: 'CANCELLED' });
      return NextResponse.json({ appointment: cancelled });
    }

    if (role === 'DOCTOR' && existing.doctorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await updateAppointment(params.id, parsed.data);
    return NextResponse.json({ appointment: updated });
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Update appointment error:', error);
    return NextResponse.json({ error: 'Failed to update appointment.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireSession(['ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await deleteAppointment(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Delete appointment error:', error);
    return NextResponse.json({ error: 'Failed to delete appointment.' }, { status: 500 });
  }
}

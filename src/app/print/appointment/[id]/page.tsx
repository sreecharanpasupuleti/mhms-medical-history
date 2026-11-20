import { notFound, redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { getAppointmentById } from '@/lib/data-store';
import { PrintToolbar } from '@/components/print/PrintToolbar';

export default async function PrintAppointmentPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getCurrentSession();
  if (!session?.user) redirect('/login');

  const appointment = await getAppointmentById(params.id);
  if (!appointment) notFound();

  const { role, id: userId } = session.user;
  const allowed =
    role === 'ADMIN' ||
    (role === 'DOCTOR' && appointment.doctorId === userId) ||
    (role === 'PATIENT' && appointment.patientId === userId);
  if (!allowed) redirect('/access-denied');

  const backHref =
    role === 'ADMIN'
      ? '/admin/appointments'
      : role === 'DOCTOR'
      ? '/doctor/appointments'
      : '/patient/appointments';

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <PrintToolbar backHref={backHref} />

      <article className="print-sheet mx-auto mt-6 max-w-3xl rounded-xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
        <header className="flex items-start justify-between gap-4 border-b border-slate-300 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              MHMS Clinical Appointment Slip
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
              Consultation Details
            </h1>
          </div>
          <div className="text-right font-mono text-xs text-slate-600">
            <p>Ref: {appointment.id}</p>
            <p>Status: {appointment.status}</p>
          </div>
        </header>

        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Scheduled Date & Time</dt>
            <dd className="mt-1 font-mono text-base font-semibold text-slate-900">
              {appointment.appointmentDate} at {appointment.appointmentTime}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Appointment Status</dt>
            <dd className="mt-1 font-semibold text-slate-900">{appointment.status}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Patient</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {appointment.patient?.fullName || appointment.patientId}
            </dd>
            <dd className="text-xs text-slate-500">{appointment.patient?.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Attending Physician</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {appointment.doctor?.fullName || appointment.doctorId}
            </dd>
            <dd className="text-xs text-slate-500">
              {appointment.doctor?.doctorProfile?.specialization || 'Physician'} ·{' '}
              {appointment.doctor?.doctorProfile?.licenseNumber || ''}
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-slate-200 pt-5 space-y-4 text-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">Reason for Consultation</p>
            <p className="mt-1 text-slate-900">{appointment.reason}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Clinical Notes</p>
            <p className="mt-1 text-slate-700">{appointment.notes || 'No additional notes.'}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

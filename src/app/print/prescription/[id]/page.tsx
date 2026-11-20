import { notFound, redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { getPrescriptionById } from '@/lib/data-store';
import { PrintToolbar } from '@/components/print/PrintToolbar';

export default async function PrintPrescriptionPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getCurrentSession();
  if (!session?.user) redirect('/login');

  const rx = await getPrescriptionById(params.id);
  if (!rx) notFound();

  const { role, id: userId } = session.user;
  const allowed =
    role === 'ADMIN' ||
    (role === 'DOCTOR' && rx.doctorId === userId) ||
    (role === 'PATIENT' && rx.patientId === userId);
  if (!allowed) redirect('/access-denied');

  const backHref =
    role === 'ADMIN'
      ? '/admin/prescriptions'
      : role === 'DOCTOR'
      ? '/doctor/prescriptions'
      : '/patient/prescriptions';

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <PrintToolbar backHref={backHref} />

      <article className="print-sheet mx-auto mt-6 max-w-3xl rounded-xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
        <header className="flex items-start justify-between gap-4 border-b border-slate-300 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              MHMS Official Medical Prescription
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
              Rx Medication Order
            </h1>
          </div>
          <div className="text-right font-mono text-xs text-slate-600">
            <p>Rx ID: {rx.id}</p>
            <p>Date: {rx.prescribedDate}</p>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-200 pb-5 text-sm">
          <div>
            <p className="text-xs text-slate-500">Patient</p>
            <p className="font-semibold text-slate-900">{rx.patient?.fullName || rx.patientId}</p>
            <p className="text-xs text-slate-500">{rx.patient?.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Prescribing Physician</p>
            <p className="font-semibold text-slate-900">{rx.doctor?.fullName || rx.doctorId}</p>
            <p className="text-xs text-slate-500">
              {rx.doctor?.doctorProfile?.specialization || 'Physician'} · License{' '}
              {rx.doctor?.doctorProfile?.licenseNumber || 'Verified'}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-6">
          <p className="font-display text-xl font-bold text-slate-900">{rx.medicineName}</p>
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Dosage</dt>
              <dd className="mt-0.5 font-mono font-semibold text-slate-900">{rx.dosage}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Frequency</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{rx.frequency}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Duration</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{rx.duration}</dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-slate-200 pt-4 text-sm">
            <p className="text-xs font-medium text-slate-500">Administration Instructions</p>
            <p className="mt-1 text-slate-800">
              {rx.instructions || 'Take exactly as directed by your prescribing physician.'}
            </p>
          </div>
        </div>

        <footer className="mt-10 flex items-end justify-between border-t border-slate-200 pt-6 text-xs text-slate-500">
          <p>Verify patient allergy profile prior to dispensing.</p>
          <div className="text-right">
            <p className="font-semibold text-slate-900">{rx.doctor?.fullName || 'Prescriber'}</p>
            <p>Electronic Clinical Signature</p>
          </div>
        </footer>
      </article>
    </div>
  );
}

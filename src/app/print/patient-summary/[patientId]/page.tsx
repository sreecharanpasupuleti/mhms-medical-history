import { notFound, redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { getPatientMedicalSummary } from '@/lib/data-store';
import { PrintToolbar } from '@/components/print/PrintToolbar';

export default async function PrintPatientSummaryPage({
  params,
}: {
  params: { patientId: string };
}) {
  const session = await getCurrentSession();
  if (!session?.user) redirect('/login');

  const { role, id: userId } = session.user;
  if (role === 'PATIENT' && userId !== params.patientId) {
    redirect('/access-denied');
  }

  const summary = await getPatientMedicalSummary(params.patientId);
  if (!summary) notFound();

  const { patient, allergies, records, prescriptions, labReports } = summary;
  const backHref =
    role === 'ADMIN' ? '/admin/patients' : role === 'DOCTOR' ? '/doctor/patients' : '/patient';

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <PrintToolbar backHref={backHref} />

      <article className="print-sheet mx-auto mt-6 max-w-4xl rounded-xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-300 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              MHMS Clinical Documentation
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
              Patient Medical Summary
            </h1>
          </div>
          <div className="text-right text-xs text-slate-600 font-mono">
            <p>Generated: {new Date().toISOString().slice(0, 10)}</p>
            <p>Patient ID: {patient.id}</p>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-200 pb-6 text-sm">
          <div>
            <p className="text-xs text-slate-500">Full Name</p>
            <p className="font-semibold text-slate-900">{patient.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Date of Birth</p>
            <p className="font-mono text-slate-900">
              {patient.patientProfile?.dateOfBirth || 'Not recorded'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Blood Group</p>
            <p className="font-mono font-semibold text-slate-900">
              {patient.patientProfile?.bloodGroup || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Insurance ID</p>
            <p className="font-mono text-slate-900">
              {patient.patientProfile?.insuranceNumber || 'Self-pay'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-slate-500">Contact & Address</p>
            <p className="text-slate-800">
              {patient.patientProfile?.phone || patient.email}
              {patient.patientProfile?.address ? ` · ${patient.patientProfile.address}` : ''}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-slate-500">Emergency Contact</p>
            <p className="text-slate-800">
              {patient.patientProfile?.emergencyContact || 'Not recorded'}
            </p>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Allergies & Sensitivities ({allergies.length})
          </h2>
          {allergies.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No known allergies recorded.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-200 border border-slate-200 rounded-lg">
              {allergies.map((a) => (
                <li key={a.id} className="px-4 py-2.5 text-sm flex justify-between gap-4">
                  <div>
                    <span className="font-semibold text-slate-900">{a.allergyName}</span>
                    {a.reaction && <span className="text-slate-600"> — {a.reaction}</span>}
                    {a.notes && <p className="text-xs text-slate-500">{a.notes}</p>}
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-800 shrink-0">
                    {a.severity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Medical Records ({records.length})
          </h2>
          {records.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No medical records documented.</p>
          ) : (
            <div className="mt-2 space-y-3">
              {records.map((r) => (
                <div key={r.id} className="rounded-lg border border-slate-200 p-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <p className="font-semibold text-slate-900">{r.diagnosis}</p>
                    <span className="font-mono text-xs text-slate-600">{r.recordDate}</span>
                  </div>
                  <p className="mt-1 text-slate-700">
                    <span className="font-medium">Symptoms:</span> {r.symptoms}
                  </p>
                  <p className="mt-1 text-slate-700">
                    <span className="font-medium">Treatment:</span> {r.treatment}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Physician: {r.doctor?.fullName || r.doctorId}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Prescriptions ({prescriptions.length})
          </h2>
          {prescriptions.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No prescriptions recorded.</p>
          ) : (
            <table className="mt-2 w-full border border-slate-200 text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Medication</th>
                  <th className="px-3 py-2">Dosage</th>
                  <th className="px-3 py-2">Frequency</th>
                  <th className="px-3 py-2">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {prescriptions.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 font-mono">{p.prescribedDate}</td>
                    <td className="px-3 py-2 font-medium text-slate-900">{p.medicineName}</td>
                    <td className="px-3 py-2 font-mono">{p.dosage}</td>
                    <td className="px-3 py-2">{p.frequency}</td>
                    <td className="px-3 py-2">{p.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Lab Reports ({labReports.length})
          </h2>
          {labReports.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No lab reports on file.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-200 border border-slate-200 rounded-lg text-sm">
              {labReports.map((l) => (
                <li key={l.id} className="px-4 py-2.5 flex justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {l.reportTitle} ({l.reportType})
                    </p>
                    {l.notes && <p className="text-xs text-slate-600">{l.notes}</p>}
                  </div>
                  <span className="font-mono text-xs text-slate-600 shrink-0">{l.reportDate}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </div>
  );
}

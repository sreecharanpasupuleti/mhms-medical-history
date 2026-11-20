import { notFound, redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { getLabReportById } from '@/lib/data-store';
import { PrintToolbar } from '@/components/print/PrintToolbar';

export default async function PrintLabReportPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getCurrentSession();
  if (!session?.user) redirect('/login');

  const report = await getLabReportById(params.id);
  if (!report) notFound();

  const { role, id: userId } = session.user;
  const allowed =
    role === 'ADMIN' ||
    (role === 'DOCTOR' && report.doctorId === userId) ||
    (role === 'PATIENT' && report.patientId === userId);
  if (!allowed) redirect('/access-denied');

  const backHref =
    role === 'ADMIN'
      ? '/admin/lab-reports'
      : role === 'DOCTOR'
      ? '/doctor/lab-reports'
      : '/patient/lab-reports';

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <PrintToolbar backHref={backHref} />

      <article className="print-sheet mx-auto mt-6 max-w-3xl rounded-xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
        <header className="flex items-start justify-between gap-4 border-b border-slate-300 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              MHMS Diagnostic Laboratory Report
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">
              {report.reportTitle}
            </h1>
          </div>
          <div className="text-right font-mono text-xs text-slate-600">
            <p>Report ID: {report.id}</p>
            <p>Date: {report.reportDate}</p>
          </div>
        </header>

        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-200 pb-5 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Patient</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {report.patient?.fullName || report.patientId}
            </dd>
            <dd className="text-xs text-slate-500">{report.patient?.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Ordering Physician</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {report.doctor?.fullName || report.doctorId}
            </dd>
            <dd className="text-xs text-slate-500">Category: {report.reportType}</dd>
          </div>
        </dl>

        <div className="mt-6 space-y-4 text-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">Diagnostic Summary & Notes</p>
            <p className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800 leading-relaxed">
              {report.notes || 'No narrative findings recorded.'}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
            <div>
              <p className="text-xs text-slate-500">Attached Diagnostic Document</p>
              <p className="font-mono text-xs font-medium text-slate-900">{report.fileName}</p>
            </div>
            <a
              href={report.fileUrl}
              className="no-print text-xs font-medium text-teal-700 hover:underline"
            >
              Download Attachment
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}

import Link from 'next/link';
import {
  AlertTriangle,
  CalendarClock,
  FileText,
  FlaskConical,
  Pill,
  Printer,
} from 'lucide-react';
import { requirePageRole } from '@/lib/page-guard';
import { getPatientMedicalSummary } from '@/lib/data-store';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default async function PatientDashboardPage() {
  const sessionUser = await requirePageRole('PATIENT');
  const summary = await getPatientMedicalSummary(sessionUser.id);

  const appointments = summary?.appointments || [];
  const records = summary?.records || [];
  const allergies = summary?.allergies || [];
  const prescriptions = summary?.prescriptions || [];
  const labReports = summary?.labReports || [];
  const profile = summary?.patient.patientProfile;

  const upcoming = appointments.filter(
    (a) => a.status === 'PENDING' || a.status === 'CONFIRMED'
  );
  const severeAllergies = allergies.filter((a) => a.severity === 'SEVERE');

  return (
    <DashboardShell
      role="PATIENT"
      title={`Welcome, ${sessionUser.fullName}`}
      breadcrumb="Patient / Health Summary"
      actions={
        <div className="flex items-center gap-2.5">
          <Link
            href={`/print/patient-summary/${sessionUser.id}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Print Summary</span>
          </Link>
          <Link
            href="/patient/appointments"
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors whitespace-nowrap"
          >
            Book Appointment
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {severeAllergies.length > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Recorded Severe Allergy Alert</p>
              <p className="mt-0.5 text-red-800">
                {severeAllergies.map((a) => a.allergyName).join(', ')} — always verify before new
                prescriptions or contrast procedures.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/patient/appointments" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-600/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Upcoming Visits</span>
              <CalendarClock className="h-4 w-4 text-teal-700" />
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {upcoming.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">{appointments.length} total appointments</p>
          </Link>

          <Link href="/patient/records" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-600/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Medical Records</span>
              <FileText className="h-4 w-4 text-teal-700" />
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {records.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">Clinical visit notes</p>
          </Link>

          <Link href="/patient/prescriptions" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-600/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Prescriptions</span>
              <Pill className="h-4 w-4 text-teal-700" />
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {prescriptions.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">Issued medications</p>
          </Link>

          <Link href="/patient/lab-reports" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-600/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Lab Reports</span>
              <FlaskConical className="h-4 w-4 text-teal-700" />
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {labReports.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">Downloadable panels</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Appointments Timeline</h2>
              <Link href="/patient/appointments" className="text-sm font-medium text-teal-700 hover:text-teal-800">
                Manage bookings
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {appointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {apt.doctor?.fullName || 'Doctor'} ·{' '}
                      <span className="text-slate-500 font-normal">
                        {apt.doctor?.doctorProfile?.specialization || 'Physician'}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">
                      {apt.appointmentDate} · {apt.appointmentTime} ·{' '}
                      <span className="font-sans">{apt.reason}</span>
                    </p>
                  </div>
                  <StatusBadge value={apt.status} />
                </div>
              ))}
              {appointments.length === 0 && (
                <p className="px-5 py-8 text-sm text-slate-500 text-center">
                  No appointments scheduled yet.
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900">Patient Profile Snapshot</h2>
              <Link href="/patient/profile" className="text-xs font-medium text-teal-700 hover:text-teal-800">
                Edit profile
              </Link>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Blood Group</dt>
                <dd className="font-mono font-semibold text-slate-900">
                  {profile?.bloodGroup || 'Not set'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Date of Birth</dt>
                <dd className="font-mono text-slate-900">
                  {profile?.dateOfBirth || 'Not set'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Insurance ID</dt>
                <dd className="font-mono text-slate-900">
                  {profile?.insuranceNumber || 'Self-pay'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Phone</dt>
                <dd className="text-slate-900">{profile?.phone || 'Not set'}</dd>
              </div>
            </dl>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">Emergency Contact</p>
              <p className="mt-0.5 text-sm text-slate-800">
                {profile?.emergencyContact || 'Add an emergency contact in your profile'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

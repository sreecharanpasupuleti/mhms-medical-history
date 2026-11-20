import Link from 'next/link';
import {
  CalendarClock,
  FileText,
  FlaskConical,
  Pill,
  Printer,
  UserCheck,
} from 'lucide-react';
import { requirePageRole } from '@/lib/page-guard';
import {
  getDoctorAssignedPatients,
  listAppointments,
  listLabReports,
  listMedicalRecords,
  listPrescriptions,
} from '@/lib/data-store';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default async function DoctorDashboardPage() {
  const user = await requirePageRole('DOCTOR');

  const [patients, appointments, records, prescriptions, labReports] = await Promise.all([
    getDoctorAssignedPatients(user.id),
    listAppointments({ doctorId: user.id }),
    listMedicalRecords({ doctorId: user.id }),
    listPrescriptions({ doctorId: user.id }),
    listLabReports({ doctorId: user.id }),
  ]);

  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;

  return (
    <DashboardShell
      role="DOCTOR"
      title={`Welcome, ${user.fullName}`}
      breadcrumb="Doctor / Clinical Desk"
      actions={
        <Link
          href="/doctor/appointments"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors whitespace-nowrap"
        >
          Manage Schedule
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href="/doctor/patients" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-600/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Assigned Patients</span>
              <UserCheck className="h-4 w-4 text-teal-700" />
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {patients.length}
            </p>
          </Link>

          <Link href="/doctor/appointments" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-600/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Appointments</span>
              <CalendarClock className="h-4 w-4 text-teal-700" />
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {appointments.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">{pendingCount} awaiting confirmation</p>
          </Link>

          <Link href="/doctor/records" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-600/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Medical Records</span>
              <FileText className="h-4 w-4 text-teal-700" />
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {records.length}
            </p>
          </Link>

          <Link href="/doctor/prescriptions" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-600/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Prescriptions</span>
              <Pill className="h-4 w-4 text-teal-700" />
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {prescriptions.length}
            </p>
          </Link>

          <Link href="/doctor/lab-reports" className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-600/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Lab Reports</span>
              <FlaskConical className="h-4 w-4 text-teal-700" />
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {labReports.length}
            </p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Your Appointments</h2>
              <Link href="/doctor/appointments" className="text-sm font-medium text-teal-700 hover:text-teal-800">
                Manage all
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {appointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {apt.patient?.fullName || 'Patient'}
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

          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Assigned Patients</h2>
              <Link href="/doctor/patients" className="text-sm font-medium text-teal-700 hover:text-teal-800">
                Directory
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {patients.map((pat) => (
                <div key={pat.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{pat.fullName}</p>
                    <p className="text-xs text-slate-500">
                      Blood {pat.patientProfile?.bloodGroup || 'N/A'} · DOB{' '}
                      {pat.patientProfile?.dateOfBirth || 'N/A'}
                    </p>
                  </div>
                  <Link
                    href={`/print/patient-summary/${pat.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Summary</span>
                  </Link>
                </div>
              ))}
              {patients.length === 0 && (
                <p className="px-5 py-8 text-sm text-slate-500 text-center">
                  No assigned patients yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

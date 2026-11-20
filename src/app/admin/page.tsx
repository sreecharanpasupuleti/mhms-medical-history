import Link from 'next/link';
import {
  CalendarClock,
  FileText,
  FlaskConical,
  Pill,
  Stethoscope,
  UserCheck,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { requirePageRole } from '@/lib/page-guard';
import { getSystemStats, listAppointments } from '@/lib/data-store';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default async function AdminDashboardPage() {
  await requirePageRole('ADMIN');
  const [stats, appointments] = await Promise.all([
    getSystemStats(),
    listAppointments(),
  ]);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, sub: `${stats.activeUsers} active`, icon: Users, href: '/admin/users' },
    { label: 'Doctors', value: stats.totalDoctors, sub: 'Registered physicians', icon: Stethoscope, href: '/admin/doctors' },
    { label: 'Patients', value: stats.totalPatients, sub: 'Active patient charts', icon: UserCheck, href: '/admin/patients' },
    { label: 'Appointments', value: stats.totalAppointments, sub: `${stats.pendingAppointments} pending`, icon: CalendarClock, href: '/admin/appointments' },
    { label: 'Medical Records', value: stats.totalRecords, sub: 'Clinical evaluations', icon: FileText, href: '/admin/records' },
    { label: 'Allergies', value: stats.totalAllergies, sub: 'Tracked alerts', icon: AlertTriangle, href: '/admin/allergies' },
    { label: 'Prescriptions', value: stats.totalPrescriptions, sub: 'Issued medications', icon: Pill, href: '/admin/prescriptions' },
    { label: 'Lab Reports', value: stats.totalLabReports, sub: 'Uploaded diagnostics', icon: FlaskConical, href: '/admin/lab-reports' },
  ];

  return (
    <DashboardShell
      role="ADMIN"
      title="System Administration"
      breadcrumb="Admin / Overview"
      actions={
        <Link
          href="/admin/users"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors whitespace-nowrap"
        >
          Manage Users
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                href={card.href}
                className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-600/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">{card.label}</span>
                  <Icon className="h-4 w-4 text-teal-700" />
                </div>
                <p className="mt-3 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
              </Link>
            );
          })}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent Appointments</h2>
              <p className="text-xs text-slate-500">
                Latest scheduled consultations across all clinical departments
              </p>
            </div>
            <Link
              href="/admin/appointments"
              className="text-sm font-medium text-teal-700 hover:text-teal-800"
            >
              View all appointments
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Doctor</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.slice(0, 6).map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono text-xs text-slate-800 tabular-nums whitespace-nowrap">
                      {apt.appointmentDate} · {apt.appointmentTime}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {apt.patient?.fullName || apt.patientId}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {apt.doctor?.fullName || apt.doctorId}
                    </td>
                    <td className="px-5 py-3 text-slate-600 max-w-xs truncate">{apt.reason}</td>
                    <td className="px-5 py-3">
                      <StatusBadge value={apt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

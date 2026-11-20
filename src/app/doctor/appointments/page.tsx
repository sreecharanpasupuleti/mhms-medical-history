import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AppointmentsPanel } from '@/components/clinical/AppointmentsPanel';

export default async function DoctorAppointmentsPage() {
  await requirePageRole('DOCTOR');

  return (
    <DashboardShell
      role="DOCTOR"
      title="Appointments"
      breadcrumb="Doctor / Appointments"
    >
      <AppointmentsPanel role="DOCTOR" />
    </DashboardShell>
  );
}

import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AppointmentsPanel } from '@/components/clinical/AppointmentsPanel';

export default async function PatientAppointmentsPage() {
  await requirePageRole('PATIENT');

  return (
    <DashboardShell
      role="PATIENT"
      title="My Appointments"
      breadcrumb="Patient / Appointments"
    >
      <AppointmentsPanel role="PATIENT" />
    </DashboardShell>
  );
}

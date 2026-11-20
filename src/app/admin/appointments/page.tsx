import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AppointmentsPanel } from '@/components/clinical/AppointmentsPanel';

export default async function AdminAppointmentsPage() {
  await requirePageRole('ADMIN');

  return (
    <DashboardShell
      role="ADMIN"
      title="All Appointments"
      breadcrumb="Admin / Appointments"
    >
      <AppointmentsPanel role="ADMIN" />
    </DashboardShell>
  );
}

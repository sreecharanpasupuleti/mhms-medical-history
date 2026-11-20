import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PrescriptionsPanel } from '@/components/clinical/PrescriptionsPanel';

export default async function DoctorPrescriptionsPage() {
  const user = await requirePageRole('DOCTOR');

  return (
    <DashboardShell
      role="DOCTOR"
      title="Prescriptions"
      breadcrumb="Doctor / Prescriptions"
    >
      <PrescriptionsPanel role="DOCTOR" currentUserId={user.id} />
    </DashboardShell>
  );
}

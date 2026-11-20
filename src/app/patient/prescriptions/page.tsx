import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PrescriptionsPanel } from '@/components/clinical/PrescriptionsPanel';

export default async function PatientPrescriptionsPage() {
  const user = await requirePageRole('PATIENT');

  return (
    <DashboardShell
      role="PATIENT"
      title="My Prescriptions"
      breadcrumb="Patient / Prescriptions"
    >
      <PrescriptionsPanel role="PATIENT" currentUserId={user.id} />
    </DashboardShell>
  );
}

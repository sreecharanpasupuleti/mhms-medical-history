import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PrescriptionsPanel } from '@/components/clinical/PrescriptionsPanel';

export default async function AdminPrescriptionsPage() {
  const user = await requirePageRole('ADMIN');

  return (
    <DashboardShell
      role="ADMIN"
      title="Prescriptions"
      breadcrumb="Admin / Prescriptions"
    >
      <PrescriptionsPanel role="ADMIN" currentUserId={user.id} />
    </DashboardShell>
  );
}

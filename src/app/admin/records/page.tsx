import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { MedicalRecordsPanel } from '@/components/clinical/MedicalRecordsPanel';

export default async function AdminRecordsPage() {
  const user = await requirePageRole('ADMIN');

  return (
    <DashboardShell
      role="ADMIN"
      title="Medical Records"
      breadcrumb="Admin / Medical Records"
    >
      <MedicalRecordsPanel role="ADMIN" currentUserId={user.id} />
    </DashboardShell>
  );
}

import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LabReportsPanel } from '@/components/clinical/LabReportsPanel';

export default async function AdminLabReportsPage() {
  const user = await requirePageRole('ADMIN');

  return (
    <DashboardShell
      role="ADMIN"
      title="Lab Reports"
      breadcrumb="Admin / Lab Reports"
    >
      <LabReportsPanel role="ADMIN" currentUserId={user.id} />
    </DashboardShell>
  );
}

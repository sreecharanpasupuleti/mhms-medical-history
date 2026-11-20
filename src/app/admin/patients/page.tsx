import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { UserManagementPanel } from '@/components/admin/UserManagementPanel';

export default async function AdminPatientsPage() {
  const user = await requirePageRole('ADMIN');

  return (
    <DashboardShell
      role="ADMIN"
      title="Patients Directory"
      breadcrumb="Admin / Patients"
    >
      <UserManagementPanel fixedRole="PATIENT" currentAdminId={user.id} />
    </DashboardShell>
  );
}

import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { UserManagementPanel } from '@/components/admin/UserManagementPanel';

export default async function AdminDoctorsPage() {
  const user = await requirePageRole('ADMIN');

  return (
    <DashboardShell
      role="ADMIN"
      title="Doctors Directory"
      breadcrumb="Admin / Doctors"
    >
      <UserManagementPanel fixedRole="DOCTOR" currentAdminId={user.id} />
    </DashboardShell>
  );
}

import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { UserManagementPanel } from '@/components/admin/UserManagementPanel';

export default async function AdminUsersPage() {
  const user = await requirePageRole('ADMIN');

  return (
    <DashboardShell
      role="ADMIN"
      title="User Management"
      breadcrumb="Admin / Users"
    >
      <UserManagementPanel currentAdminId={user.id} />
    </DashboardShell>
  );
}

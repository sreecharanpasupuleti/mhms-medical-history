import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ProfilePanel } from '@/components/clinical/ProfilePanel';

export default async function AdminProfilePage() {
  await requirePageRole('ADMIN');

  return (
    <DashboardShell
      role="ADMIN"
      title="Administrator Profile"
      breadcrumb="Admin / Profile"
    >
      <ProfilePanel />
    </DashboardShell>
  );
}

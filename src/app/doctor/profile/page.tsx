import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ProfilePanel } from '@/components/clinical/ProfilePanel';

export default async function DoctorProfilePage() {
  await requirePageRole('DOCTOR');

  return (
    <DashboardShell
      role="DOCTOR"
      title="Physician Profile"
      breadcrumb="Doctor / Profile"
    >
      <ProfilePanel />
    </DashboardShell>
  );
}

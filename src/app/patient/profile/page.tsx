import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ProfilePanel } from '@/components/clinical/ProfilePanel';

export default async function PatientProfilePage() {
  await requirePageRole('PATIENT');

  return (
    <DashboardShell
      role="PATIENT"
      title="My Profile"
      breadcrumb="Patient / Profile"
    >
      <ProfilePanel />
    </DashboardShell>
  );
}

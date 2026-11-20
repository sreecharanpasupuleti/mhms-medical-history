import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LabReportsPanel } from '@/components/clinical/LabReportsPanel';

export default async function DoctorLabReportsPage() {
  const user = await requirePageRole('DOCTOR');

  return (
    <DashboardShell
      role="DOCTOR"
      title="Lab Reports"
      breadcrumb="Doctor / Lab Reports"
    >
      <LabReportsPanel role="DOCTOR" currentUserId={user.id} />
    </DashboardShell>
  );
}

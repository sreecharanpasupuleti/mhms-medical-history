import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LabReportsPanel } from '@/components/clinical/LabReportsPanel';

export default async function PatientLabReportsPage() {
  const user = await requirePageRole('PATIENT');

  return (
    <DashboardShell
      role="PATIENT"
      title="My Lab Reports"
      breadcrumb="Patient / Lab Reports"
    >
      <LabReportsPanel role="PATIENT" currentUserId={user.id} />
    </DashboardShell>
  );
}

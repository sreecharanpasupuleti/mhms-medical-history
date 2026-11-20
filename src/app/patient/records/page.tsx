import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { MedicalRecordsPanel } from '@/components/clinical/MedicalRecordsPanel';

export default async function PatientRecordsPage() {
  const user = await requirePageRole('PATIENT');

  return (
    <DashboardShell
      role="PATIENT"
      title="My Medical Records"
      breadcrumb="Patient / Medical Records"
    >
      <MedicalRecordsPanel role="PATIENT" currentUserId={user.id} />
    </DashboardShell>
  );
}

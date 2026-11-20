import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { MedicalRecordsPanel } from '@/components/clinical/MedicalRecordsPanel';

export default async function DoctorRecordsPage() {
  const user = await requirePageRole('DOCTOR');

  return (
    <DashboardShell
      role="DOCTOR"
      title="Medical Records"
      breadcrumb="Doctor / Medical Records"
    >
      <MedicalRecordsPanel role="DOCTOR" currentUserId={user.id} />
    </DashboardShell>
  );
}

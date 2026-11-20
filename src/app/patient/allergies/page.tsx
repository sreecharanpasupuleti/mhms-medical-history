import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AllergiesPanel } from '@/components/clinical/AllergiesPanel';

export default async function PatientAllergiesPage() {
  await requirePageRole('PATIENT');

  return (
    <DashboardShell
      role="PATIENT"
      title="My Allergies"
      breadcrumb="Patient / Allergies"
    >
      <AllergiesPanel role="PATIENT" />
    </DashboardShell>
  );
}

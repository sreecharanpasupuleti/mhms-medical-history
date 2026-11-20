import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AllergiesPanel } from '@/components/clinical/AllergiesPanel';

export default async function DoctorAllergiesPage() {
  await requirePageRole('DOCTOR');

  return (
    <DashboardShell
      role="DOCTOR"
      title="Patient Allergies"
      breadcrumb="Doctor / Allergies"
    >
      <AllergiesPanel role="DOCTOR" />
    </DashboardShell>
  );
}

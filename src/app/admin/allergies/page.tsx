import { requirePageRole } from '@/lib/page-guard';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AllergiesPanel } from '@/components/clinical/AllergiesPanel';

export default async function AdminAllergiesPage() {
  await requirePageRole('ADMIN');

  return (
    <DashboardShell
      role="ADMIN"
      title="Patient Allergies"
      breadcrumb="Admin / Allergies"
    >
      <AllergiesPanel role="ADMIN" />
    </DashboardShell>
  );
}

import { Suspense } from 'react';
import StudentsContent from '@/components/platform/students/content';
import { getTenantContext } from '@/components/platform/operator/lib/tenant';

export const metadata = { title: 'Dashboard: Students' }

async function StudentsWrapper() {
  const { schoolId } = await getTenantContext();
  
  // For the old route, we don't have school data, so we pass undefined
  // The content component will fall back to using tenant context
  return (
    <StudentsContent 
      searchParams={Promise.resolve({})} 
      school={undefined}
    />
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div>Loading students...</div>}>
      <StudentsWrapper />
    </Suspense>
  );
}
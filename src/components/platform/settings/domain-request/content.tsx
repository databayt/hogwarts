import { auth } from '@/auth';
import { db } from '@/lib/db';
import { DomainRequestForm } from './form';

export async function DomainRequestContent() {
  const session = await auth();
  
  if (!session?.user?.schoolId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please sign in to manage domain requests.</p>
      </div>
    );
  }

  // Get current school domain
  const school = await db.school.findUnique({
    where: { id: session.user.schoolId },
    select: { domain: true },
  });

  // Get existing domain requests
  const domainRequests = await db.domainRequest.findMany({
    where: { schoolId: session.user.schoolId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <DomainRequestForm
      currentDomain={school?.domain}
      existingRequests={domainRequests}
    />
  );
}
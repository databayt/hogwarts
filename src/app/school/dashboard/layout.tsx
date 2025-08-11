import { Shell as PageContainer } from '@/components/table/shell'
import { db } from '@/lib/db'
import { getTenantContext } from '@/components/platform/operator/lib/tenant'
import { DashboardBreadcrumbs } from '@/components/school/dashboard/breadcrumbs'
import { QuickSearch } from '@/components/school/dashboard/quick-search'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { schoolId } = await getTenantContext()
  const school = schoolId ? await db.school.findUnique({ where: { id: schoolId }, select: { name: true, domain: true } }) : null

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              {school?.name ?? 'Dashboard'}
            </h1>
            {school?.domain ? (
              <p className="text-sm text-muted-foreground">{school.domain}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <DashboardBreadcrumbs />
          <QuickSearch />
        </div>
        {children}
      </div>
    </PageContainer>
  )
}



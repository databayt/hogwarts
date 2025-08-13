// import { auth } from '@/auth';
// import { redirect } from 'next/navigation';
import { TenantRow } from '@/components/platform/operator/tenants/columns';
import { getTenants } from '@/components/platform/operator/tenants/queries';
import { tenantsSearchParams } from '@/components/platform/operator/tenants/validation';
import { SearchParams } from 'nuqs/server';
// import { getTenantContext } from '@/lib/utils';
import { TenantsContent } from '@/components/platform/operator/tenants/content';

export const metadata = {
  title: 'Dashboard: Tenants'
};

export default async function TenantsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  // const session = await auth();
  // if (!session) redirect('/login');
  // const { isPlatformAdmin } = await getTenantContext();
  // if (!isPlatformAdmin) redirect('/403');

  const sp = await tenantsSearchParams.parse(await searchParams);
  const { data, pageCount } = await getTenants({
    page: sp.page,
    perPage: sp.perPage,
    search: sp.search,
    // column filters
    name: sp.name || undefined,
    domain: sp.domain || undefined,
    planType: (sp.planType || sp.plan) || undefined,
    isActive: (sp.isActive || sp.status) || undefined,
    sort: [{ id: 'createdAt', desc: true }],
  });
  const rows: TenantRow[] = data.map((s) => ({
    id: s.id,
    name: s.name,
    domain: s.domain,
    isActive: s.isActive,
    planType: s.planType,
    createdAt: s.createdAt?.toISOString?.() ?? String(s.createdAt),
    trialEndsAt: null,
  }));

  return <TenantsContent rows={rows} page={sp.page} pageCount={pageCount} />;
}




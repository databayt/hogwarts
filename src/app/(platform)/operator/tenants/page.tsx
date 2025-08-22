// import { auth } from '@/auth';
// import { redirect } from 'next/navigation';
import { TenantsContent } from '@/components/platform/operator/tenants/content';

export const metadata = {
  title: "Tenant Management",
  description: "Manage school subdomains and tenant settings"
};

export default function TenantsPage() {
  return <TenantsContent />;
}




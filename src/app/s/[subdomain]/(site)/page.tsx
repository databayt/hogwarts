import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSchoolBySubdomain } from '@/lib/subdomain-actions';
import SiteContent from '@/components/site/content';
import { headers } from 'next/headers';

// Get the current domain dynamically
async function getCurrentDomain(): Promise<{ protocol: string; rootDomain: string }> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
  if (host.includes('localhost')) {
    return { protocol: 'http', rootDomain: 'localhost:3000' };
  }
  
  // Extract root domain from host (e.g., "tenant1.databayt.org" -> "databayt.org")
  const parts = host.split('.');
  if (parts.length >= 2) {
    return { protocol: 'https', rootDomain: parts.slice(-2).join('.') };
  }
  
  return { protocol: 'https', rootDomain: host };
}

interface TenantProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: TenantProps): Promise<Metadata> {
  const { subdomain } = await params;
  const result = await getSchoolBySubdomain(subdomain);
  const { rootDomain } = await getCurrentDomain();

  if (!result.success || !result.data) {
    return {
      title: rootDomain
    };
  }

  const school = result.data;
  return {
    title: `${school.name} | ${subdomain}.${rootDomain}`,
    description: `Welcome to ${school.name} - Your school management portal`,
    openGraph: {
      title: `${school.name} | ${subdomain}.${rootDomain}`,
      description: `Welcome to ${school.name} - Your school management portal`,
      url: `https://${subdomain}.${rootDomain}`,
      siteName: school.name,
    }
  };
}

export default async function Tenant({ params }: TenantProps) {
  const { subdomain } = await params;
  const result = await getSchoolBySubdomain(subdomain);
  const { protocol, rootDomain } = await getCurrentDomain();

  if (!result.success || !result.data) {
    notFound();
  }

  const school = result.data;

  return (
    <div className="relative">
      {/* Back to main site link (following reference pattern) */}
      <div className="absolute top-4 right-4 z-50">
        <Link
          href={`${protocol}://${rootDomain}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors bg-white/80 backdrop-blur-sm px-3 py-1 rounded-md"
        >
          {rootDomain}
        </Link>
      </div>

      {/* School-specific content using your existing site components */}
      <div className="school-content" data-school-id={school.id} data-subdomain={subdomain}>
        <SiteContent school={school} />
      </div>
    </div>
  );
}
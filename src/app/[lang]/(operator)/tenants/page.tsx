import { TenantsContent } from '@/components/operator/tenants/content';
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import { PageHeadingSetter } from '@/components/platform/context/page-heading-setter';
import { PageNav, type PageNavItem } from '@/components/atom/page-nav';

export const metadata = {
  title: "Tenant Management",
  description: "Manage school subdomains and tenant settings"
};

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Tenants({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  const d = dictionary?.operator;

  // Define tenants page navigation
  const tenantsPages: PageNavItem[] = [
    { name: 'Overview', href: `/${lang}/tenants` },
    { name: 'Domains', href: `/${lang}/domains` },
  ];

  return (
    <div className="space-y-6">
      <PageHeadingSetter title="Tenants" />
      <PageNav pages={tenantsPages} />
      <TenantsContent dictionary={dictionary} lang={lang} />
    </div>
  );
}




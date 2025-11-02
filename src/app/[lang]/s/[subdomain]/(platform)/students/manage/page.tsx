import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSchoolBySubdomain } from '@/lib/subdomain-actions';
import { getCurrentDomain } from '@/components/site/utils';
import { generateSchoolMetadata, generateDefaultMetadata } from '@/components/site/metadata';
import { getDictionary } from '@/components/internationalization/dictionaries';
import { type Locale } from '@/components/internationalization/config';
import PageHeader from '@/components/atom/page-header';
import { PageNav, type PageNavItem } from '@/components/atom/page-nav';

interface StudentsManageProps {
  params: Promise<{ subdomain: string; lang: Locale }>;
}

export async function generateMetadata({ params }: StudentsManageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const result = await getSchoolBySubdomain(subdomain);
  const { rootDomain } = await getCurrentDomain();

  if (!result.success || !result.data) {
    return generateDefaultMetadata(rootDomain);
  }

  return generateSchoolMetadata({
    school: result.data,
    subdomain,
    rootDomain
  });
}

export default async function StudentsManage({ params }: StudentsManageProps) {
  const { subdomain, lang } = await params;
  const dictionary = await getDictionary(lang);
  const result = await getSchoolBySubdomain(subdomain);

  if (!result.success || !result.data) {
    notFound();
  }

  const school = result.data;
  const dict = dictionary.school.students;

  const studentPages: PageNavItem[] = [
    { name: dict.overview || 'Overview', href: `/${lang}/s/${subdomain}/students` },
    { name: dict.manage || 'Manage', href: `/${lang}/s/${subdomain}/students/manage` },
    { name: dict.analysis || 'Analysis', href: `/${lang}/s/${subdomain}/students/analysis` },
  ];

  return (
    <div className="school-content" data-school-id={school.id} data-subdomain={subdomain}>
      <div className="space-y-6">
        <PageHeader
          title={dict.title}
          className="text-start max-w-none"
        />
        <PageNav pages={studentPages} />
        <div className="rounded-lg border bg-card p-8">
          <div className="space-y-4">
            <h3 className="text-foreground">{dict.manage || 'Manage Students'}</h3>
            <p className="text-muted-foreground">
              This page is under construction. Student management features will be available here soon.
            </p>
            <p className="text-muted-foreground">
              Planned features: Bulk operations, class assignments, promotions, transfers, and more.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

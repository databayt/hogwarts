import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSchoolBySubdomain } from '@/lib/subdomain-actions';
import StudentsContent from '@/components/platform/students/content';
import { getCurrentDomain } from '@/components/site/utils';
import { generateSchoolMetadata, generateDefaultMetadata } from '@/components/site/metadata';
import { getDictionary } from '@/components/internationalization/dictionaries';
import { type Locale } from '@/components/internationalization/config';
import PageHeader from '@/components/atom/page-header';
import { PageNav, type PageNavItem } from '@/components/atom/page-nav';

interface StudentsProps {
  params: Promise<{ subdomain: string; lang: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: StudentsProps): Promise<Metadata> {
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

export default async function Students({ params, searchParams }: StudentsProps) {
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
        <StudentsContent school={school} searchParams={searchParams} dictionary={dictionary.school} />
      </div>
    </div>
  );
}
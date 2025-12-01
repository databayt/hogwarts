import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSchoolBySubdomain } from '@/lib/subdomain-actions';
import AdmissionContent from "@/components/site/admission/content";
import { getCurrentDomain } from '@/components/site/utils';
import { generateSchoolMetadata, generateDefaultMetadata } from '@/components/site/metadata';
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface AdmissionProps {
  params: Promise<{ lang: Locale; subdomain: string }>;
}

export async function generateMetadata({ params }: AdmissionProps): Promise<Metadata> {
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

export default async function Admission({ params }: AdmissionProps) {
  const { lang, subdomain } = await params;
  const dictionary = await getDictionary(lang);
  const result = await getSchoolBySubdomain(subdomain);

  if (!result.success || !result.data) {
    notFound();
  }

  const school = result.data;

  return (
    <div className="school-content" data-school-id={school.id} data-subdomain={subdomain}>
      <AdmissionContent school={school} dictionary={dictionary} lang={lang} />
    </div>
  );
}

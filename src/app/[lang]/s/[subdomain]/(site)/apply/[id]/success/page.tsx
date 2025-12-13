import SuccessContent from '@/components/site/apply/success/content';
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import { getSchoolBySubdomain } from "@/lib/subdomain-actions";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Application Submitted",
};

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>;
  searchParams: Promise<{ number?: string }>;
}

export default async function SuccessPage({ params, searchParams }: Props) {
  const { lang, subdomain, id } = await params;
  const { number: applicationNumber } = await searchParams;
  const dictionary = await getDictionary(lang);
  const schoolResult = await getSchoolBySubdomain(subdomain);

  if (!schoolResult.success || !schoolResult.data) {
    notFound();
  }

  return (
    <SuccessContent
      dictionary={dictionary}
      applicationNumber={applicationNumber}
      schoolName={schoolResult.data.name}
    />
  );
}

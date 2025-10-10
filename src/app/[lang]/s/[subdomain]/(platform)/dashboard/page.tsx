import DashboardContent from "@/components/platform/dashboard/content";
import { getSchoolBySubdomain } from "@/lib/subdomain-actions";
import { notFound } from "next/navigation";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ subdomain: string; lang: Locale }>;
}

export default async function Dashboard({ params }: Props) {
  const { subdomain, lang } = await params;
  const dictionary = await getDictionary(lang);
  console.log('DashboardPage - params:', { subdomain });
  
  const result = await getSchoolBySubdomain(subdomain);
  console.log('DashboardPage - getSchoolBySubdomain result:', result);

  if (!result.success || !result.data) {
    console.error('School not found for subdomain:', subdomain, result);
    notFound();
  }

  const school = result.data;
  console.log('DashboardPage - school data:', school);

  return <DashboardContent school={school} dictionary={dictionary.school} />;
}
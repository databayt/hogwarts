import { Metadata } from "next";
import DashboardContent from "@/components/platform/dashboard/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ subdomain: string; lang: Locale }>;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.school.dashboard.title || "Dashboard",
    description: dictionary.school.dashboard.welcome || "School management lab",
  };
}

export default async function DashboardPage({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  // Note: School data is already provided by the layout via SchoolProvider
  // We don't need to fetch it again here - just pass the dictionary and locale
  return <DashboardContent dictionary={dictionary.school} locale={lang} />;
}
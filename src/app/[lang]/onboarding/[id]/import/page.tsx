import ImportContent from "@/components/onboarding/import/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Import Data",
};

interface PageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Import({ params }: PageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <ImportContent dictionary={dictionary.school} />;
}
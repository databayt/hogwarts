import GenerateContent from "@/components/platform/exams/generate/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface PageProps {
  params: Promise<{
    lang: Locale;
    subdomain: string;
  }>;
}

export default async function GeneratePage({ params }: PageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <GenerateContent dictionary={dictionary} lang={lang} />;
}

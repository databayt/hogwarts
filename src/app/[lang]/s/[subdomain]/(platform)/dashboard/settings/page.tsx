import SettingsContent from "@/components/platform/dashboard/settings/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
}

export default async function Settings({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <SettingsContent dictionary={dictionary} lang={lang} />;
}
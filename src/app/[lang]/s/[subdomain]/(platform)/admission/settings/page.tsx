import { Metadata } from "next";
import SettingsContent from '@/components/platform/admission/settings-content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.school.admission?.settings?.title || "Admission Settings",
    description: "Configure admission settings and preferences",
  };
}

export default async function SettingsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <SettingsContent dictionary={dictionary.school} lang={lang} />
}

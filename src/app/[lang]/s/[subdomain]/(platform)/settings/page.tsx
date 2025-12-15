import { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { EnhancedSettingsContent } from "@/components/platform/settings/content-enhanced"
import { SettingsErrorBoundary } from "@/components/platform/settings/error-boundary"

export const metadata: Metadata = {
  title: "Settings - School Management",
  description: "Manage school settings, users, roles, and permissions",
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <SettingsErrorBoundary dictionary={dictionary.school}>
      <EnhancedSettingsContent dictionary={dictionary} lang={lang} />
    </SettingsErrorBoundary>
  )
}

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getAnnouncementConfig } from "./actions"
import { SettingsForm } from "./form"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function SettingsContent({ dictionary, lang }: Props) {
  const config = await getAnnouncementConfig()

  return (
    <div className="space-y-6">
      <SettingsForm config={config} lang={lang} />
    </div>
  )
}

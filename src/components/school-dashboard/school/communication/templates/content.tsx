import { Suspense } from "react"

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getTemplates } from "./actions"
import { TemplateTable } from "./table"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function TemplatesContent({ dictionary, lang }: Props) {
  const templates = await getTemplates()

  return (
    <div className="space-y-6">
      <TemplateTable templates={templates} lang={lang} />
    </div>
  )
}
